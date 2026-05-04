# Quick Setup Guide

## Step-by-Step Installation

### 1. Install PostgreSQL
Download and install PostgreSQL from https://www.postgresql.org/download/

### 2. Create Database
```bash
# Open PostgreSQL command line or pgAdmin
createdb task_tracker

# Or using psql:
psql -U postgres
CREATE DATABASE task_tracker;
\q
```

### 3. Install Node.js Dependencies
```bash
# In project root
npm install

# In client folder
cd client
npm install
cd ..
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and update:

```env
# Required - Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_tracker
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Required - JWT
JWT_SECRET=generate_a_random_secret_key_here

# Required - OpenAI (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-key-here

# Optional - Email (Get from https://sendgrid.com/)
SENDGRID_API_KEY=SG.your-key-here
FROM_EMAIL=noreply@yourdomain.com

# Optional - WhatsApp (Get from https://www.twilio.com/)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

Create `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Run Database Migration
```bash
npm run migrate
```

This will create all tables and insert sample data.

### 6. Start the Application
```bash
# Option 1: Run both frontend and backend together
npm run dev

# Option 2: Run separately
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client
npm start
```

### 7. Access the Application

Open browser to: http://localhost:3000

**Demo Login:**
- Email: `john.leader@company.com`
- Password: `password123`

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DB credentials in `.env`
- Ensure database `task_tracker` exists

### Port Already in Use
- Change PORT in `.env` (backend)
- Change port in `client/package.json` (frontend)

### OpenAI API Errors
- Verify API key is valid
- Check account has credits
- Ensure OPENAI_API_KEY is set correctly

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

## Production Deployment

### 1. Build Frontend
```bash
cd client
npm run build
```

### 2. Set Production Environment
```env
NODE_ENV=production
```

### 3. Use Process Manager
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server/index.js --name task-tracker

# View logs
pm2 logs task-tracker
```

### 4. Configure Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## API Keys Setup

### OpenAI
1. Go to https://platform.openai.com/
2. Sign up / Login
3. Navigate to API Keys
4. Create new secret key
5. Copy to `.env` as `OPENAI_API_KEY`

### SendGrid (Email)
1. Go to https://sendgrid.com/
2. Sign up for free account
3. Navigate to Settings > API Keys
4. Create API Key with "Mail Send" permissions
5. Copy to `.env` as `SENDGRID_API_KEY`
6. Verify sender email in SendGrid dashboard

### Twilio (WhatsApp)
1. Go to https://www.twilio.com/
2. Sign up for account
3. Navigate to Console Dashboard
4. Copy Account SID and Auth Token
5. Enable WhatsApp Sandbox for testing
6. Configure webhook URL: `https://yourdomain.com/api/notifications/whatsapp-webhook`

## Testing the System

### 1. Create a Task
- Login to dashboard
- Navigate to Tasks
- Click "New Task"
- Fill in details and save

### 2. Test Reminders
- Select tasks in grid
- Click "Send Reminders"
- Check email/WhatsApp

### 3. Test Escalation
- Create overdue task
- Click "Escalate"
- Verify escalation emails sent

### 4. Test WhatsApp Bot
- Send message to Twilio WhatsApp number
- Try: "Task 1 completed"
- Verify task updates

## Support

For issues, check:
1. Server logs: `npm run server`
2. Browser console (F12)
3. Database logs
4. API response errors

Common fixes:
- Restart server
- Clear browser cache
- Check all API keys are valid
- Verify database connection
