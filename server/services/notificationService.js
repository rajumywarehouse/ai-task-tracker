const logger = require('../config/logger');

const USE_MOCK_NOTIFICATIONS = !process.env.SENDGRID_API_KEY || process.env.USE_MOCK_NOTIFICATIONS === 'true';

let sgMail = null;
let twilioClient = null;

if (!USE_MOCK_NOTIFICATIONS) {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const twilio = require('twilio');
    twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✓ Using real notification services');
} else {
    console.log('✓ Using mock notifications (static mode)');
}

class NotificationService {
    async sendEmail(to, subject, text, html) {
        if (USE_MOCK_NOTIFICATIONS || !sgMail) {
            logger.info(`[MOCK] Email would be sent to ${to}: ${subject}`);
            return { success: true, mock: true };
        }

        try {
            const msg = {
                to,
                from: process.env.FROM_EMAIL,
                subject,
                text,
                html: html || text
            };

            await sgMail.send(msg);
            logger.info(`Email sent to ${to}`);
            return { success: true };
        } catch (error) {
            logger.error('Email sending error:', error);
            return { success: false, error: error.message };
        }
    }

    async sendWhatsApp(to, message) {
        if (USE_MOCK_NOTIFICATIONS || !twilioClient) {
            logger.info(`[MOCK] WhatsApp would be sent to ${to}: ${message.substring(0, 50)}...`);
            return { success: true, messageId: 'MOCK_' + Date.now(), mock: true };
        }

        try {
            const formattedNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            
            const result = await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_WHATSAPP_NUMBER,
                to: formattedNumber
            });

            logger.info(`WhatsApp sent to ${to}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            logger.error('WhatsApp sending error:', error);
            return { success: false, error: error.message };
        }
    }

    async sendTaskReminder(user, tasks, message) {
        const results = {};

        if (user.email) {
            const html = this.generateReminderHTML(user, tasks, message);
            results.email = await this.sendEmail(
                user.email,
                'Task Reminder - Action Required',
                message,
                html
            );
        }

        if (user.phone_number) {
            results.whatsapp = await this.sendWhatsApp(user.phone_number, message);
        }

        return results;
    }

    async sendEscalation(recipients, task, message) {
        const results = [];

        for (const recipient of recipients) {
            if (recipient.email) {
                const html = this.generateEscalationHTML(task, message);
                const result = await this.sendEmail(
                    recipient.email,
                    `ESCALATION: Task #${task.task_id} - ${task.priority} Priority`,
                    message,
                    html
                );
                results.push({ recipient: recipient.email, ...result });
            }
        }

        return results;
    }

    generateReminderHTML(user, tasks, message) {
        const taskRows = tasks.map(task => {
            const isOverdue = new Date(task.sla_deadline) < new Date();
            const rowColor = isOverdue ? '#ffebee' : task.priority === 'High' ? '#fff3e0' : '#ffffff';
            
            return `
                <tr style="background-color: ${rowColor};">
                    <td style="padding: 10px; border: 1px solid #ddd;">#${task.task_id}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${task.task_description}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${task.priority}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${new Date(task.target_date).toLocaleDateString()}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${task.status}</td>
                </tr>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #2196F3; color: white; padding: 12px; text-align: left; }
                    .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Task Reminder</h1>
                    </div>
                    <div class="content">
                        <p>${message.replace(/\n/g, '<br>')}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Description</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${taskRows}
                            </tbody>
                        </table>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from the Task Tracking System.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateEscalationHTML(task, message) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #fff; border: 2px solid #f44336; }
                    .task-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
                    .urgent { color: #f44336; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ TASK ESCALATION</h1>
                    </div>
                    <div class="content">
                        <p class="urgent">URGENT ACTION REQUIRED</p>
                        <p>${message.replace(/\n/g, '<br>')}</p>
                        <div class="task-details">
                            <h3>Task Details:</h3>
                            <p><strong>Task ID:</strong> #${task.task_id}</p>
                            <p><strong>Description:</strong> ${task.task_description}</p>
                            <p><strong>Priority:</strong> ${task.priority}</p>
                            <p><strong>Assigned To:</strong> ${task.responsible_person_name}</p>
                            <p><strong>Due Date:</strong> ${new Date(task.target_date).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> ${task.status}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = new NotificationService();
