const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const slaService = require('../services/slaService');
const logger = require('../config/logger');

const router = express.Router();

router.post('/erp/import', [authenticate, authorize('Leader', 'Manager')], async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Tasks must be an array' });
        }

        const imported = [];
        const errors = [];

        for (const task of tasks) {
            try {
                const {
                    task_description,
                    priority,
                    responsible_person_email,
                    target_date,
                    sla_type,
                    erp_reference
                } = task;

                const userResult = await db.query(
                    'SELECT user_id FROM users WHERE email = $1',
                    [responsible_person_email]
                );

                if (userResult.rows.length === 0) {
                    errors.push({
                        task: task_description,
                        error: `User not found: ${responsible_person_email}`
                    });
                    continue;
                }

                const slaDeadline = slaService.calculateSLADeadline(
                    new Date(),
                    sla_type || '24hrs'
                );

                const result = await db.query(
                    `INSERT INTO tasks (
                        task_description, priority, responsible_person_id, target_date,
                        sla_type, sla_deadline, source, erp_reference, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, 'ERP', $7, $8)
                    RETURNING task_id`,
                    [
                        task_description,
                        priority || 'Medium',
                        userResult.rows[0].user_id,
                        target_date,
                        sla_type || '24hrs',
                        slaDeadline,
                        erp_reference,
                        req.user.userId
                    ]
                );

                imported.push({
                    taskId: result.rows[0].task_id,
                    erpReference: erp_reference
                });
            } catch (error) {
                errors.push({
                    task: task.task_description,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            imported: imported.length,
            failed: errors.length,
            details: { imported, errors }
        });
    } catch (error) {
        logger.error('ERP import error:', error);
        res.status(500).json({ error: 'Failed to import from ERP' });
    }
});

router.post('/erp/sync-status', [authenticate, authorize('Leader', 'Manager')], async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates must be an array' });
        }

        const synced = [];

        for (const update of updates) {
            const { erp_reference, status } = update;

            const result = await db.query(
                `UPDATE tasks SET status = $1 WHERE erp_reference = $2 RETURNING task_id`,
                [status, erp_reference]
            );

            if (result.rows.length > 0) {
                synced.push({
                    taskId: result.rows[0].task_id,
                    erpReference: erp_reference,
                    status
                });
            }
        }

        res.json({
            success: true,
            synced: synced.length,
            details: synced
        });
    } catch (error) {
        logger.error('ERP sync error:', error);
        res.status(500).json({ error: 'Failed to sync with ERP' });
    }
});

router.post('/email/parse', [authenticate, authorize('Leader', 'Manager')], async (req, res) => {
    try {
        const {
            email_subject,
            email_body,
            from_email,
            email_reference
        } = req.body;

        const userResult = await db.query(
            'SELECT user_id FROM users WHERE email = $1',
            [from_email]
        );

        let responsiblePersonId = req.user.userId;
        if (userResult.rows.length > 0) {
            responsiblePersonId = userResult.rows[0].user_id;
        }

        const taskDescription = email_subject || email_body.substring(0, 200);
        
        const slaDeadline = slaService.calculateSLADeadline(new Date(), '24hrs');

        const result = await db.query(
            `INSERT INTO tasks (
                task_description, priority, responsible_person_id, target_date,
                sla_type, sla_deadline, source, email_reference, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, 'Email', $7, $8)
            RETURNING *`,
            [
                taskDescription,
                'Medium',
                responsiblePersonId,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                '24hrs',
                slaDeadline,
                email_reference,
                req.user.userId
            ]
        );

        res.status(201).json({
            success: true,
            task: result.rows[0]
        });
    } catch (error) {
        logger.error('Email parse error:', error);
        res.status(500).json({ error: 'Failed to create task from email' });
    }
});

router.get('/export/tasks', authenticate, async (req, res) => {
    try {
        const { format = 'json' } = req.query;

        const result = await db.query(`
            SELECT 
                t.task_id,
                t.created_date,
                t.task_description,
                t.priority,
                u.name as responsible_person,
                t.target_date,
                t.sla_type,
                t.sla_deadline,
                t.status,
                t.remarks,
                t.escalation_level,
                t.source
            FROM tasks t
            JOIN users u ON t.responsible_person_id = u.user_id
            ORDER BY t.created_date DESC
        `);

        if (format === 'csv') {
            const csv = convertToCSV(result.rows);
            res.header('Content-Type', 'text/csv');
            res.attachment('tasks_export.csv');
            res.send(csv);
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        logger.error('Export tasks error:', error);
        res.status(500).json({ error: 'Failed to export tasks' });
    }
});

function convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
        Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
    );

    return [headers, ...rows].join('\n');
}

module.exports = router;
