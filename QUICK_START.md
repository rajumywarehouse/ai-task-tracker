# Quick Start Guide - Static Data Mode

This application is configured to run with **static mock data** - no database or API keys required!

## Installation

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Start the Application

```bash
# Start both backend and frontend
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend (in new terminal)
cd client
npm start
```

### 3. Access the Application

Open your browser to: **http://localhost:3000**

### 4. Login

Use these demo credentials:

- **Email**: `john.leader@company.com`
- **Password**: `password123`

## What's Included

### ✅ Fully Functional Features (Static Mode)

- **Dashboard** with metrics and charts
- **Task Grid** with AG Grid (Excel-like interface)
- **Create/Edit/Update Tasks**
- **Inline Editing** in the grid
- **Bulk Operations** (select multiple tasks)
- **Filters** (status, priority, overdue)
- **Color-coded rows** (red=overdue, yellow=approaching, green=completed)
- **AI-generated summaries** (mock responses)
- **Mock notifications** (logged to console)
- **Role-based access** (Leader, Manager, Team Member)
- **Task comments and history**
- **Export to CSV**

### 📊 Sample Data

The system comes pre-loaded with:
- **5 Users** (1 Leader, 1 Manager, 3 Team Members)
- **10 Tasks** (various statuses and priorities)
- **6 Departments**
- **Task comments and history**

### 🎭 Mock Services

In static mode, the following are simulated:
- **Database**: In-memory mock database
- **AI Responses**: Pre-formatted fallback messages
- **Email Notifications**: Logged to console
- **WhatsApp Messages**: Logged to console

## Available Users

| Name | Email | Role | Password |
|------|-------|------|----------|
| John Leader | john.leader@company.com | Leader | password123 |
| Sarah Manager | sarah.manager@company.com | Manager | password123 |
| Mike Developer | mike.dev@company.com | Team Member | password123 |
| Lisa Sales | lisa.sales@company.com | Team Member | password123 |
| Tom Designer | tom.designer@company.com | Team Member | password123 |

## Features to Try

### 1. Dashboard
- View real-time metrics
- See AI-generated executive summary
- Check SLA compliance charts
- Review team workload

### 2. Task Management
- Click "New Task" to create tasks
- Edit tasks inline by clicking cells
- Select multiple tasks and send reminders
- Filter by status, priority, or overdue
- Export tasks to CSV

### 3. Bulk Operations
- Select tasks using checkboxes
- Click "Send Reminders" to trigger notifications
- Click "Escalate" to escalate selected tasks

### 4. Role-Based Views
- Login as different users to see role-specific features
- Leaders see all tasks
- Team Members see only their tasks

## Switching to Real Services

To use real database and APIs, create a `.env` file:

```env
# Disable mock mode
USE_MOCK_DB=false
USE_MOCK_AI=false
USE_MOCK_NOTIFICATIONS=false

# Add your real credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_tracker
DB_USER=postgres
DB_PASSWORD=your_password

OPENAI_API_KEY=sk-your-key
SENDGRID_API_KEY=SG.your-key
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

Then run database migration:
```bash
npm run migrate
```

## Troubleshooting

### Port Already in Use
If port 3000 or 5000 is in use:
- Backend: Change `PORT` in package.json scripts
- Frontend: Set `PORT=3001` before `npm start`

### Module Not Found
```bash
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

### Changes Not Reflecting
- Restart the server
- Clear browser cache (Ctrl+Shift+R)
- Check console for errors (F12)

## Project Structure

```
2048/
├── server/               # Backend
│   ├── data/            # Mock data
│   ├── database/        # DB connection
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── index.js         # Server entry
├── client/              # Frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API calls
│   │   └── store/       # State management
│   └── public/
└── README.md
```

## Next Steps

1. **Explore the Dashboard** - See metrics and AI insights
2. **Create Tasks** - Add new tasks and assign to team members
3. **Try Bulk Actions** - Select multiple tasks and send reminders
4. **Test Filters** - Filter by status, priority, or overdue
5. **Export Data** - Download tasks as CSV

## Support

For issues:
1. Check browser console (F12)
2. Check server terminal for errors
3. Verify all dependencies installed
4. Try restarting the application

---

**Enjoy exploring the AI-Powered Task Tracking System!** 🚀
