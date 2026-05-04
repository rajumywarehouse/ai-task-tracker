const cron = require('node-cron');
const slaService = require('../services/slaService');
const logger = require('../config/logger');

function startScheduledJobs() {
    cron.schedule('0 9 * * *', async () => {
        logger.info('Running daily reminder job...');
        try {
            await slaService.sendDueReminders();
            logger.info('Daily reminders sent successfully');
        } catch (error) {
            logger.error('Daily reminder job failed:', error);
        }
    });

    cron.schedule('0 */4 * * *', async () => {
        logger.info('Running escalation check job...');
        try {
            await slaService.processEscalations();
            logger.info('Escalation check completed');
        } catch (error) {
            logger.error('Escalation job failed:', error);
        }
    });

    cron.schedule('0 8 * * 1', async () => {
        logger.info('Running weekly SLA breach check...');
        try {
            const breaches = await slaService.checkSLABreaches();
            logger.info(`Found ${breaches.length} SLA breaches`);
        } catch (error) {
            logger.error('Weekly SLA check failed:', error);
        }
    });

    logger.info('✓ Scheduled jobs started');
}

module.exports = { startScheduledJobs };
