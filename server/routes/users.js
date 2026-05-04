const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.user_id, u.name, u.email, u.phone_number, u.role, 
                    u.department_id, d.name as department_name,
                    m.name as manager_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.department_id
             LEFT JOIN users m ON u.manager_id = m.user_id
             WHERE u.is_active = true
             ORDER BY u.name`
        );

        res.json(result.rows);
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT u.user_id, u.name, u.email, u.phone_number, u.role,
                    u.department_id, d.name as department_name,
                    m.name as manager_name, m.user_id as manager_id
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.department_id
             LEFT JOIN users m ON u.manager_id = m.user_id
             WHERE u.user_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.get('/:id/tasks', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT * FROM tasks 
             WHERE responsible_person_id = $1
             ORDER BY created_date DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        logger.error('Get user tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch user tasks' });
    }
});

router.put('/:id', [authenticate, authorize('Leader', 'Manager')], async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_number, manager_id, department_id, role } = req.body;

        const result = await db.query(
            `UPDATE users 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 phone_number = COALESCE($3, phone_number),
                 manager_id = COALESCE($4, manager_id),
                 department_id = COALESCE($5, department_id),
                 role = COALESCE($6, role)
             WHERE user_id = $7
             RETURNING user_id, name, email, phone_number, role, department_id`,
            [name, email, phone_number, manager_id, department_id, role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.get('/departments/list', authenticate, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM departments ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        logger.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

module.exports = router;
