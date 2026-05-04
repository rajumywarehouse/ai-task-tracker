const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');
const slaService = require('../services/slaService');
const logger = require('../config/logger');

const router = express.Router();

router.post('/send-reminders', [authenticate, authorize('Leader', 'Manager')], async (req, res) => {
    try {
        const { task_ids, user_ids } = req.body;

        let query = `
            SELECT t.*, u.name as responsible_person_name, u.email, u.phone_number
            FROM tasks t
            JOIN users u ON t.responsible_person_id = u.user_id
            WHERE t.status != 'Completed'
        `;
        const params = [];

        if (task_ids && task_ids.length > 0) {
            query += ' AND t.task_id = ANY($1)';
            params.push(task_ids);
        } else if (user_ids && user_ids.length > 0) {
            query += ' AND t.responsible_person_id = ANY($1)';
            params.push(user_ids);
        }

        const result = await db.query(query, params);
        const tasksByUser = slaService.groupTasksByUser(result.rows);

        const sentReminders = [];

        for (const [userId, tasks] of Object.entries(tasksByUser)) {
            const user = tasks[0];
            const message = await aiService.generateTaskReminder(tasks, user.responsible_person_name);
            const sendResult = await notificationService.sendTaskReminder(user, tasks, message);
            
            sentReminders.push({
                userId,
                userName: user.responsible_person_name,
                taskCount: tasks.length,
                ...sendResult
            });
        }

        res.json({
            success: true,
            remindersSent: sentReminders.length,
            details: sentReminders
        });
    } catch (error) {
        logger.error('Send reminders error:', error);
        res.status(500).json({ error: 'Failed to send reminders' });
    }
});

router.post('/escalate-tasks', [authenticate, authorize('Leader', 'Manager')], async (req, res) => {
    try {
        const { task_ids } = req.body;

        let query = `
            SELECT t.*, u.name as responsible_person_name
            FROM tasks t
            JOIN users u ON t.responsible_person_id = u.user_id
            WHERE t.sla_deadline < NOW() 
            AND t.status != 'Completed'
        `;

        if (task_ids && task_ids.length > 0) {
            query += ' AND t.task_id = ANY($1)';
        }

        const result = await db.query(
            query,
            task_ids && task_ids.length > 0 ? [task_ids] : []
        );

        const escalations = [];

        for (const task of result.rows) {
            const daysOverdue = Math.floor((new Date() - new Date(task.sla_deadline)) / (1000 * 60 * 60 * 24));
            let newLevel = task.escalation_level;

            if (daysOverdue >= 3 && task.escalation_level < 2) {
                newLevel = 2;
            } else if (daysOverdue >= 1 && task.escalation_level < 1) {
                newLevel = 1;
            }

            if (newLevel > task.escalation_level) {
                await slaService.escalateTask(task, newLevel);
                escalations.push({
                    taskId: task.task_id,
                    oldLevel: task.escalation_level,
                    newLevel
                });
            }
        }

        res.json({
            success: true,
            escalationsProcessed: escalations.length,
            details: escalations
        });
    } catch (error) {
        logger.error('Escalate tasks error:', error);
        res.status(500).json({ error: 'Failed to escalate tasks' });
    }
});

router.post('/whatsapp-webhook', async (req, res) => {
    try {
        const { From, Body } = req.body;

        const phoneNumber = From.replace('whatsapp:', '');
        
        const userResult = await db.query(
            'SELECT * FROM users WHERE phone_number = $1',
            [phoneNumber]
        );

        if (userResult.rows.length === 0) {
            await notificationService.sendWhatsApp(
                From,
                'Sorry, your phone number is not registered in the system.'
            );
            return res.status(200).send('OK');
        }

        const user = userResult.rows[0];
        const interpretation = await aiService.interpretWhatsAppMessage(Body, user.user_id);

        if (interpretation.taskId) {
            const taskResult = await db.query(
                'SELECT * FROM tasks WHERE task_id = $1 AND responsible_person_id = $2',
                [interpretation.taskId, user.user_id]
            );

            if (taskResult.rows.length > 0) {
                const updates = {};
                
                if (interpretation.status) {
                    updates.status = interpretation.status;
                }

                if (interpretation.delayDays) {
                    const newTargetDate = new Date();
                    newTargetDate.setDate(newTargetDate.getDate() + interpretation.delayDays);
                    updates.target_date = newTargetDate.toISOString().split('T')[0];
                }

                if (interpretation.notes) {
                    updates.remarks = interpretation.notes;
                }

                if (Object.keys(updates).length > 0) {
                    const updateFields = [];
                    const values = [];
                    let paramCount = 1;

                    for (const [key, value] of Object.entries(updates)) {
                        updateFields.push(`${key} = $${paramCount}`);
                        values.push(value);
                        paramCount++;
                    }

                    values.push(interpretation.taskId);
                    await db.query(
                        `UPDATE tasks SET ${updateFields.join(', ')} WHERE task_id = $${paramCount}`,
                        values
                    );

                    await db.query(
                        `INSERT INTO task_history (task_id, user_id, action, new_value)
                         VALUES ($1, $2, 'whatsapp_update', $3)`,
                        [interpretation.taskId, user.user_id, Body]
                    );

                    await notificationService.sendWhatsApp(
                        From,
                        `✓ Task #${interpretation.taskId} updated successfully!`
                    );
                } else {
                    await notificationService.sendWhatsApp(
                        From,
                        `Task #${interpretation.taskId} found. Please specify what you'd like to update.`
                    );
                }
            } else {
                await notificationService.sendWhatsApp(
                    From,
                    `Task #${interpretation.taskId} not found or not assigned to you.`
                );
            }
        } else {
            const tasksResult = await db.query(
                `SELECT * FROM tasks 
                 WHERE responsible_person_id = $1 
                 AND status != 'Completed'
                 ORDER BY sla_deadline ASC
                 LIMIT 5`,
                [user.user_id]
            );

            if (tasksResult.rows.length > 0) {
                let message = `You have ${tasksResult.rows.length} pending task(s):\n\n`;
                tasksResult.rows.forEach(task => {
                    message += `#${task.task_id}: ${task.task_description.substring(0, 50)}...\n`;
                });
                message += '\nReply with "Task [ID] completed" to update.';

                await notificationService.sendWhatsApp(From, message);
            } else {
                await notificationService.sendWhatsApp(
                    From,
                    'You have no pending tasks. Great job!'
                );
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        logger.error('WhatsApp webhook error:', error);
        res.status(500).send('Error');
    }
});

module.exports = router;
