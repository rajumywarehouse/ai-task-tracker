const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'ai-task-tracker-dev-secret-key-2024';
}
if (!process.env.JWT_EXPIRE) {
    process.env.JWT_EXPIRE = '7d';
}

const logger = require('./config/logger');
const { startScheduledJobs } = require('./jobs/scheduler');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const integrationRoutes = require('./routes/integrations');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        logger.info(`✓ Server running on port ${PORT}`);
        logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        
        startScheduledJobs();
    });
}

module.exports = app;
