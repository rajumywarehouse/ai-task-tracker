const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const slaService = require('../services/slaService');
const logger = require('../config/logger');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    try {
        const { status, priority, responsible_person_id, overdue, sla_breach } = req.query;
        
        let query = `
            SELECT t.*, 
                   u.name as responsible_person_name,
                   u.email as responsible_person_email,
                   creator.name as created_by_name
            FROM tasks t
            JOIN users u ON t.responsible_person_id = u.user_id
            LEFT JOIN users creator ON t.created_by = creator.user_id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (req.user.role === 'Team Member') {
            query += ` AND t.responsible_person_id = $${paramCount}`;
            params.push(req.user.userId);
            paramCount++;
        }

        if (status) {
            query += ` AND t.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (priority) {
            query += ` AND t.priority = $${paramCount}`;
            params.push(priority);
            paramCount++;
        }

        if (responsible_person_id) {
            query += ` AND t.responsible_person_id = $${paramCount}`;
            params.push(responsible_person_id);
            paramCount++;
        }

        if (overdue === 'true') {
            query += ` AND t.sla_deadline < NOW() AND t.status != 'Completed'`;
        }

        if (sla_breach === 'true') {
            query += ` AND t.sla_deadline < NOW() AND t.status != 'Completed'`;
        }

        query += ' ORDER BY t.created_date DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT t.*, 
                    u.name as responsible_person_name,
                    u.email as responsible_person_email,
                    creator.name as created_by_name
             FROM tasks t
             JOIN users u ON t.responsible_person_id = u.user_id
             LEFT JOIN users creator ON t.created_by = creator.user_id
             WHERE t.task_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const commentsResult = await db.query(
            `SELECT c.*, u.name as user_name
             FROM task_comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.task_id = $1
             ORDER BY c.created_at DESC`,
            [id]
        );

        const historyResult = await db.query(
            `SELECT h.*, u.name as user_name
             FROM task_history h
             LEFT JOIN users u ON h.user_id = u.user_id
             WHERE h.task_id = $1
             ORDER BY h.timestamp DESC`,
            [id]
        );

        res.json({
            task: result.rows[0],
            comments: commentsResult.rows,
            history: historyResult.rows
        });
    } catch (error) {
        logger.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

router.post('/', [
    authenticate,
    body('task_description').notEmpty(),
    body('priority').isIn(['High', 'Medium', 'Low']),
    body('responsible_person_id').isInt(),
    body('target_date').isISO8601(),
    body('sla_type').isIn(['24hrs', '48hrs', '72hrs', 'Custom'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            task_description,
            priority,
            responsible_person_id,
            target_date,
            sla_type,
            custom_sla_hours,
            auto_reminder,
            remarks
        } = req.body;

        const slaDeadline = slaService.calculateSLADeadline(
            new Date(),
            sla_type,
            custom_sla_hours
        );

        const result = await db.query(
            `INSERT INTO tasks (
                task_description, priority, responsible_person_id, target_date,
                sla_type, sla_deadline, auto_reminder, remarks, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                task_description,
                priority,
                responsible_person_id,
                target_date,
                sla_type,
                slaDeadline,
                auto_reminder !== false,
                remarks,
                req.user.userId
            ]
        );

        await db.query(
            `INSERT INTO task_history (task_id, user_id, action, new_value)
             VALUES ($1, $2, 'created', $3)`,
            [result.rows[0].task_id, req.user.userId, task_description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const currentTask = await db.query('SELECT * FROM tasks WHERE task_id = $1', [id]);
        if (currentTask.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const allowedFields = [
            'task_description', 'priority', 'responsible_person_id', 'target_date',
            'sla_type', 'status', 'remarks', 'escalation_level'
        ];

        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;

                await db.query(
                    `INSERT INTO task_history (task_id, user_id, action, field_changed, old_value, new_value)
                     VALUES ($1, $2, 'updated', $3, $4, $5)`,
                    [id, req.user.userId, key, String(currentTask.rows[0][key]), String(value)]
                );
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);
        const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE task_id = $${paramCount} RETURNING *`;

        const result = await db.query(query, values);

        if (updates.status === 'Completed') {
            await db.query(
                'UPDATE tasks SET completed_date = NOW() WHERE task_id = $1',
                [id]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

router.delete('/:id', [authenticate, authorize('Leader', 'Manager')], async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM tasks WHERE task_id = $1', [id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        logger.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const result = await db.query(
            `INSERT INTO task_comments (task_id, user_id, comment)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [id, req.user.userId, comment]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

router.post('/bulk-update', authenticate, async (req, res) => {
    try {
        const { task_ids, updates } = req.body;

        if (!Array.isArray(task_ids) || task_ids.length === 0) {
            return res.status(400).json({ error: 'Invalid task_ids' });
        }

        const allowedFields = ['status', 'priority', 'responsible_person_id'];
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(task_ids);
        const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE task_id = ANY($${paramCount}) RETURNING *`;

        const result = await db.query(query, values);

        res.json({ updated: result.rowCount, tasks: result.rows });
    } catch (error) {
        logger.error('Bulk update error:', error);
        res.status(500).json({ error: 'Failed to bulk update tasks' });
    }
});

module.exports = router;
