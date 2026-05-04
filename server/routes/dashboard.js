const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');
const slaService = require('../services/slaService');
const aiService = require('../services/aiService');
const logger = require('../config/logger');

const router = express.Router();

router.get('/metrics', authenticate, async (req, res) => {
    try {
        const metrics = await slaService.getTaskMetrics();
        res.json(metrics);
    } catch (error) {
        logger.error('Get metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

router.get('/tasks-by-status', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT status, COUNT(*) as count
            FROM tasks
            GROUP BY status
            ORDER BY count DESC
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Get tasks by status error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.get('/tasks-by-priority', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT priority, COUNT(*) as count
            FROM tasks
            WHERE status != 'Completed'
            GROUP BY priority
            ORDER BY 
                CASE priority
                    WHEN 'High' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'Low' THEN 3
                END
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Get tasks by priority error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.get('/tasks-by-person', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.name, COUNT(t.task_id) as task_count,
                   COUNT(*) FILTER (WHERE t.status = 'Completed') as completed,
                   COUNT(*) FILTER (WHERE t.sla_deadline < NOW() AND t.status != 'Completed') as overdue
            FROM users u
            LEFT JOIN tasks t ON u.user_id = t.responsible_person_id
            WHERE u.is_active = true
            GROUP BY u.user_id, u.name
            HAVING COUNT(t.task_id) > 0
            ORDER BY task_count DESC
            LIMIT 10
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Get tasks by person error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.get('/sla-compliance', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE sla_deadline >= NOW() OR status = 'Completed') as within_sla,
                COUNT(*) FILTER (WHERE sla_deadline < NOW() AND status != 'Completed') as breached
            FROM tasks
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Get SLA compliance error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.get('/ai-summary', authenticate, async (req, res) => {
    try {
        const tasksResult = await db.query(`
            SELECT t.*, u.name as responsible_person_name
            FROM tasks t
            JOIN users u ON t.responsible_person_id = u.user_id
            WHERE t.status != 'Completed'
        `);

        const usersResult = await db.query('SELECT * FROM users WHERE is_active = true');

        const summary = await aiService.generateLeaderSummary(
            tasksResult.rows,
            usersResult.rows
        );

        res.json({ summary });
    } catch (error) {
        logger.error('Get AI summary error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

router.get('/overdue-tasks', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, u.name as responsible_person_name
            FROM tasks t
            JOIN users u ON t.responsible_person_id = u.user_id
            WHERE t.sla_deadline < NOW() 
            AND t.status != 'Completed'
            ORDER BY t.sla_deadline ASC
            LIMIT 20
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Get overdue tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch overdue tasks' });
    }
});

router.get('/team-workload', authenticate, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.user_id,
                u.name,
                u.role,
                d.name as department,
                COUNT(t.task_id) as total_tasks,
                COUNT(*) FILTER (WHERE t.status = 'Pending') as pending,
                COUNT(*) FILTER (WHERE t.status = 'In Progress') as in_progress,
                COUNT(*) FILTER (WHERE t.priority = 'High' AND t.status != 'Completed') as high_priority,
                COUNT(*) FILTER (WHERE t.sla_deadline < NOW() AND t.status != 'Completed') as overdue
            FROM users u
            LEFT JOIN tasks t ON u.user_id = t.responsible_person_id
            LEFT JOIN departments d ON u.department_id = d.department_id
            WHERE u.is_active = true
            GROUP BY u.user_id, u.name, u.role, d.name
            ORDER BY total_tasks DESC
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Get team workload error:', error);
        res.status(500).json({ error: 'Failed to fetch team workload' });
    }
});

module.exports = router;
