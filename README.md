# AI-Powered Task Tracking & Execution Intelligence System

A comprehensive full-stack application for enterprise task management with AI-driven automation, smart notifications, and execution intelligence.

## 🚀 Quick Start (Static Data Mode)

**No database or API keys required!** The system runs with mock data out of the box.

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Start the application
npm run dev

# 3. Open browser to http://localhost:3000

# 4. Login with: john.leader@company.com / password123
```

**That's it!** See [QUICK_START.md](QUICK_START.md) for details or [START_HERE.txt](START_HERE.txt) for a visual guide.

## 🚀 Features

### Core Capabilities
- **Task Management**: Create, assign, track, and manage tasks with Excel-like grid interface
- **AI-Powered Automation**: Smart reminders, escalations, and insights using OpenAI
- **SLA Tracking**: Automated SLA monitoring with visual indicators and breach detection
- **Multi-Channel Notifications**: Email (SendGrid) and WhatsApp (Twilio) integration
- **Conversational AI**: WhatsApp bot for task updates via natural language
- **Dashboard Analytics**: Real-time metrics, charts, and AI-generated summaries
- **Role-Based Access**: Leader, Manager, and Team Member roles with appropriate permissions
- **ERP & Email Integration**: Import tasks from ERP systems and convert emails to tasks

### Advanced Features
- Inline editing with AG Grid
- Bulk task operations
- Automated escalation logic (3-level hierarchy)
- Activity logs and audit trails
- Comment system with history
- Export to CSV/Excel
- Real-time SLA compliance tracking
- Team workload visualization

## 📋 Tech Stack

### Backend
- **Framework**: Node.js + Express
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4
- **Notifications**: SendGrid (Email), Twilio (WhatsApp)
- **Authentication**: JWT
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 18
- **Grid**: AG Grid (Enterprise-grade data grid)
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State**: Zustand
- **HTTP**: Axios

## 🛠️ Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- OpenAI API Key
- SendGrid API Key
- Twilio Account (for WhatsApp)

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_tracker
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=7d

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend
FRONTEND_URL=http://localhost:3000
```

Create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Database Setup

```bash
# Create database
createdb task_tracker

# Run migrations
npm run migrate
```

### 4. Start the Application

```bash
# Development mode (runs both backend and frontend)
npm run dev

# Or run separately:
# Backend
npm run server

# Frontend (in another terminal)
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Database Schema

### Tables
- **users**: User accounts with role-based access
- **departments**: Organizational departments
- **tasks**: Main task tracking table
- **task_history**: Audit trail for all task changes
- **task_comments**: Comment system for tasks

### Key Fields
- Task_ID, Created_Date, Task_Description
- Priority (High/Medium/Low)
- Responsible_Person, Target_Date
- SLA_Type, SLA_Deadline, Auto_Reminder
- Escalation_Level (0/1/2)
- Status (Pending/In Progress/Completed/Delayed)

## 🤖 AI Features

### 1. Smart Reminders
AI generates personalized reminder messages based on:
- Task count and priority
- Overdue status
- User workload

### 2. Escalation Messages
Context-aware escalation notifications with:
- Urgency level
- Days overdue
- Task priority and details

### 3. Leader Summaries
Executive insights including:
- Top risks and bottlenecks
- Team workload analysis
- Actionable recommendations

### 4. WhatsApp Conversational AI
Natural language processing for:
- Task status updates
- Deadline extensions
- Query responses

## 📱 WhatsApp Integration

### Setup Webhook
Configure Twilio webhook to point to:
```
https://your-domain.com/api/notifications/whatsapp-webhook
```

### Usage Examples
```
User: "Task 45 completed"
Bot: ✓ Task #45 updated successfully!

User: "Delay task 23 by 2 days"
Bot: ✓ Task #23 deadline extended!

User: "Show my tasks"
Bot: You have 3 pending tasks:
#12: Review proposal...
#23: Update documentation...
#45: Client meeting...
```

## 🔔 Automated Jobs

### Daily Reminders (9 AM)
- Sends reminders for tasks due today or tomorrow
- Only for tasks with auto_reminder enabled

### Escalation Check (Every 4 hours)
- Checks for SLA breaches
- Auto-escalates based on days overdue:
  - +1 day → Level 1 (Manager)
  - +3 days → Level 2 (Senior Leader)

### Weekly SLA Report (Monday 8 AM)
- Generates SLA breach summary
- Sends to leadership team

## 🔐 Authentication & Authorization

### Roles
- **Leader**: Full access to all features
- **Manager**: Can manage team tasks, send reminders, escalate
- **Team Member**: Can view and update own tasks

### Login Credentials (Demo)
```
Email: john.leader@company.com
Password: password123
```

## 📈 API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Tasks
- GET `/api/tasks` - Get all tasks (with filters)
- GET `/api/tasks/:id` - Get task details
- POST `/api/tasks` - Create task
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task
- POST `/api/tasks/bulk-update` - Bulk update tasks

### Dashboard
- GET `/api/dashboard/metrics` - Get dashboard metrics
- GET `/api/dashboard/ai-summary` - Get AI-generated summary
- GET `/api/dashboard/team-workload` - Get team workload

### Notifications
- POST `/api/notifications/send-reminders` - Send task reminders
- POST `/api/notifications/escalate-tasks` - Escalate tasks
- POST `/api/notifications/whatsapp-webhook` - WhatsApp webhook

### Integrations
- POST `/api/integrations/erp/import` - Import from ERP
- POST `/api/integrations/email/parse` - Parse email to task
- GET `/api/integrations/export/tasks` - Export tasks

## 🎨 UI Features

### Task Grid
- Excel-like interface with inline editing
- Color-coded rows (red=overdue, yellow=approaching, green=completed)
- Column filters, sorting, grouping
- Bulk selection and actions
- Pagination

### Dashboard
- Real-time metrics cards
- Interactive charts (Pie, Bar)
- AI insights widget
- Team workload table
- SLA compliance visualization

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Set environment to production
NODE_ENV=production

# Start server
npm start
```

### Environment Variables
Ensure all production API keys and secrets are set in `.env`

## 📝 License

MIT License

## 🤝 Support

For issues and questions, please contact your system administrator.

---

**Built with ❤️ for enterprise task execution excellence**
