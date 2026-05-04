const db = require('../database/db');
const logger = require('../config/logger');
const aiService = require('./aiService');
const notificationService = require('./notificationService');

class SLAService {
    calculateSLADeadline(createdDate, slaType, customHours = null) {
        const created = new Date(createdDate);
        let hours = 24;

        switch (slaType) {
            case '24hrs':
                hours = 24;
                break;
            case '48hrs':
                hours = 48;
                break;
            case '72hrs':
                hours = 72;
                break;
            case 'Custom':
                hours = customHours || 24;
                break;
        }

        return new Date(created.getTime() + hours * 60 * 60 * 1000);
    }

    async checkSLABreaches() {
        try {
            const query = `
                SELECT t.*, u.name as responsible_person_name, u.email, u.phone_number
                FROM tasks t
                JOIN users u ON t.responsible_person_id = u.user_id
                WHERE t.status != 'Completed'
                AND t.sla_deadline < NOW()
                ORDER BY t.sla_deadline ASC
            `;

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            logger.error('SLA breach check error:', error);
            return [];
        }
    }

    async processEscalations() {
        try {
            const breachedTasks = await this.checkSLABreaches();
            const escalations = [];

            for (const task of breachedTasks) {
                const daysOverdue = Math.floor((new Date() - new Date(task.sla_deadline)) / (1000 * 60 * 60 * 24));
                let newEscalationLevel = task.escalation_level;

                if (daysOverdue >= 3 && task.escalation_level < 2) {
                    newEscalationLevel = 2;
                } else if (daysOverdue >= 1 && task.escalation_level < 1) {
                    newEscalationLevel = 1;
                }

                if (newEscalationLevel > task.escalation_level) {
                    await this.escalateTask(task, newEscalationLevel);
                    escalations.push({
                        taskId: task.task_id,
                        oldLevel: task.escalation_level,
                        newLevel: newEscalationLevel
                    });
                }
            }

            logger.info(`Processed ${escalations.length} escalations`);
            return escalations;
        } catch (error) {
            logger.error('Escalation processing error:', error);
            return [];
        }
    }

    async escalateTask(task, newLevel) {
        try {
            await db.query(
                'UPDATE tasks SET escalation_level = $1 WHERE task_id = $2',
                [newLevel, task.task_id]
            );

            const recipients = await this.getEscalationRecipients(task, newLevel);
            const message = await aiService.generateEscalationMessage(task, newLevel);

            await notificationService.sendEscalation(recipients, task, message);

            await db.query(
                `INSERT INTO task_history (task_id, action, old_value, new_value, field_changed)
                 VALUES ($1, 'escalation', $2, $3, 'escalation_level')`,
                [task.task_id, task.escalation_level.toString(), newLevel.toString()]
            );

            logger.info(`Task ${task.task_id} escalated to level ${newLevel}`);
        } catch (error) {
            logger.error('Task escalation error:', error);
        }
    }

    async getEscalationRecipients(task, level) {
        try {
            const recipients = [];

            if (level >= 1) {
                const managerQuery = `
                    SELECT u.* FROM users u
                    WHERE u.user_id = (
                        SELECT manager_id FROM users WHERE user_id = $1
                    )
                `;
                const managerResult = await db.query(managerQuery, [task.responsible_person_id]);
                if (managerResult.rows.length > 0) {
                    recipients.push(managerResult.rows[0]);
                }
            }

            if (level >= 2) {
                const leaderQuery = `
                    SELECT * FROM users WHERE role = 'Leader' AND is_active = true
                `;
                const leaderResult = await db.query(leaderQuery);
                recipients.push(...leaderResult.rows);
            }

            return recipients;
        } catch (error) {
            logger.error('Get escalation recipients error:', error);
            return [];
        }
    }

    async sendDueReminders() {
        try {
            const query = `
                SELECT t.*, u.name as responsible_person_name, u.email, u.phone_number
                FROM tasks t
                JOIN users u ON t.responsible_person_id = u.user_id
                WHERE t.status != 'Completed'
                AND t.auto_reminder = true
                AND (
                    DATE(t.target_date) = CURRENT_DATE
                    OR DATE(t.target_date) = CURRENT_DATE + INTERVAL '1 day'
                )
            `;

            const result = await db.query(query);
            const tasksByUser = this.groupTasksByUser(result.rows);

            for (const [userId, tasks] of Object.entries(tasksByUser)) {
                const user = tasks[0];
                const message = await aiService.generateTaskReminder(tasks, user.responsible_person_name);
                await notificationService.sendTaskReminder(user, tasks, message);
            }

            logger.info(`Sent reminders for ${result.rows.length} tasks`);
        } catch (error) {
            logger.error('Send due reminders error:', error);
        }
    }

    groupTasksByUser(tasks) {
        return tasks.reduce((acc, task) => {
            const userId = task.responsible_person_id;
            if (!acc[userId]) {
                acc[userId] = [];
            }
            acc[userId].push(task);
            return acc;
        }, {});
    }

    async getTaskMetrics() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(*) FILTER (WHERE status = 'Pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
                    COUNT(*) FILTER (WHERE status = 'Completed') as completed,
                    COUNT(*) FILTER (WHERE status = 'Delayed') as delayed,
                    COUNT(*) FILTER (WHERE sla_deadline < NOW() AND status != 'Completed') as sla_breaches,
                    COUNT(*) FILTER (WHERE priority = 'High' AND status != 'Completed') as high_priority_pending
                FROM tasks
            `;

            const result = await db.query(query);
            return result.rows[0];
        } catch (error) {
            logger.error('Get task metrics error:', error);
            return {};
        }
    }
}

module.exports = new SLAService();
