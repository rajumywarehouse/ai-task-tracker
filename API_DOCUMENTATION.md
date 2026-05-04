# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All endpoints except `/auth/login` and `/auth/register` require JWT token in header:
```
Authorization: Bearer <token>
```

### POST /auth/login
Login user and get JWT token.

**Request:**
```json
{
  "email": "john.leader@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Leader",
    "email": "john.leader@company.com",
    "role": "Leader"
  }
}
```

### POST /auth/register
Register new user.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "password": "password123",
  "phone_number": "+1234567890",
  "role": "Team Member",
  "department_id": 1
}
```

## Tasks

### GET /tasks
Get all tasks with optional filters.

**Query Parameters:**
- `status`: Pending | In Progress | Completed | Delayed
- `priority`: High | Medium | Low
- `responsible_person_id`: User ID
- `overdue`: true | false
- `sla_breach`: true | false

**Response:**
```json
[
  {
    "task_id": 1,
    "task_description": "Complete project proposal",
    "priority": "High",
    "responsible_person_id": 3,
    "responsible_person_name": "Mike Developer",
    "target_date": "2024-01-15",
    "sla_type": "24hrs",
    "sla_deadline": "2024-01-14T10:00:00Z",
    "status": "In Progress",
    "escalation_level": 0,
    "created_date": "2024-01-13T10:00:00Z"
  }
]
```

### GET /tasks/:id
Get task details with comments and history.

**Response:**
```json
{
  "task": { /* task object */ },
  "comments": [
    {
      "comment_id": 1,
      "user_name": "John Leader",
      "comment": "Please prioritize this",
      "created_at": "2024-01-13T11:00:00Z"
    }
  ],
  "history": [
    {
      "history_id": 1,
      "action": "updated",
      "field_changed": "status",
      "old_value": "Pending",
      "new_value": "In Progress",
      "timestamp": "2024-01-13T12:00:00Z"
    }
  ]
}
```

### POST /tasks
Create new task.

**Request:**
```json
{
  "task_description": "Review quarterly report",
  "priority": "High",
  "responsible_person_id": 3,
  "target_date": "2024-01-20",
  "sla_type": "48hrs",
  "auto_reminder": true,
  "remarks": "Urgent review needed"
}
```

### PUT /tasks/:id
Update task.

**Request:**
```json
{
  "status": "Completed",
  "remarks": "Task completed successfully"
}
```

### DELETE /tasks/:id
Delete task (Leader/Manager only).

### POST /tasks/bulk-update
Bulk update multiple tasks.

**Request:**
```json
{
  "task_ids": [1, 2, 3],
  "updates": {
    "status": "In Progress",
    "priority": "High"
  }
}
```

### POST /tasks/:id/comments
Add comment to task.

**Request:**
```json
{
  "comment": "Making good progress on this"
}
```

## Users

### GET /users
Get all active users.

**Response:**
```json
[
  {
    "user_id": 1,
    "name": "John Leader",
    "email": "john.leader@company.com",
    "role": "Leader",
    "department_name": "Engineering",
    "manager_name": null
  }
]
```

### GET /users/:id
Get user details.

### PUT /users/:id
Update user (Leader/Manager only).

**Request:**
```json
{
  "name": "John Smith",
  "phone_number": "+1234567890",
  "department_id": 2
}
```

### GET /users/:id/tasks
Get all tasks for a user.

### GET /users/departments/list
Get all departments.

## Dashboard

### GET /dashboard/metrics
Get dashboard metrics.

**Response:**
```json
{
  "total_tasks": 45,
  "pending": 12,
  "in_progress": 8,
  "completed": 20,
  "delayed": 5,
  "sla_breaches": 3,
  "high_priority_pending": 6
}
```

### GET /dashboard/tasks-by-status
Get task count by status.

**Response:**
```json
[
  { "status": "Pending", "count": 12 },
  { "status": "In Progress", "count": 8 },
  { "status": "Completed", "count": 20 }
]
```

### GET /dashboard/tasks-by-priority
Get task count by priority.

### GET /dashboard/tasks-by-person
Get task distribution by person.

### GET /dashboard/sla-compliance
Get SLA compliance metrics.

**Response:**
```json
{
  "within_sla": 38,
  "breached": 7
}
```

### GET /dashboard/ai-summary
Get AI-generated executive summary.

**Response:**
```json
{
  "summary": "Top risks:\n- 6 high-priority tasks overdue\n- 3 team members overloaded\n\nRecommendations:\n- Redistribute tasks from overloaded members\n- Escalate critical overdue items"
}
```

### GET /dashboard/overdue-tasks
Get list of overdue tasks.

### GET /dashboard/team-workload
Get team workload analysis.

## Notifications

### POST /notifications/send-reminders
Send AI-generated reminders (Leader/Manager only).

**Request:**
```json
{
  "task_ids": [1, 2, 3]
}
```
or
```json
{
  "user_ids": [3, 4]
}
```

**Response:**
```json
{
  "success": true,
  "remindersSent": 2,
  "details": [
    {
      "userId": "3",
      "userName": "Mike Developer",
      "taskCount": 4,
      "email": { "success": true },
      "whatsapp": { "success": true, "messageId": "SM..." }
    }
  ]
}
```

### POST /notifications/escalate-tasks
Escalate tasks (Leader/Manager only).

**Request:**
```json
{
  "task_ids": [1, 2]
}
```

**Response:**
```json
{
  "success": true,
  "escalationsProcessed": 2,
  "details": [
    {
      "taskId": 1,
      "oldLevel": 0,
      "newLevel": 1
    }
  ]
}
```

### POST /notifications/whatsapp-webhook
WhatsApp webhook endpoint (configured in Twilio).

**Request (from Twilio):**
```json
{
  "From": "whatsapp:+1234567890",
  "Body": "Task 45 completed"
}
```

## Integrations

### POST /integrations/erp/import
Import tasks from ERP (Leader/Manager only).

**Request:**
```json
{
  "tasks": [
    {
      "task_description": "Process invoice #1234",
      "priority": "High",
      "responsible_person_email": "mike.dev@company.com",
      "target_date": "2024-01-20",
      "sla_type": "24hrs",
      "erp_reference": "INV-1234"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": 1,
  "failed": 0,
  "details": {
    "imported": [
      { "taskId": 46, "erpReference": "INV-1234" }
    ],
    "errors": []
  }
}
```

### POST /integrations/erp/sync-status
Sync task status back to ERP.

**Request:**
```json
{
  "updates": [
    {
      "erp_reference": "INV-1234",
      "status": "Completed"
    }
  ]
}
```

### POST /integrations/email/parse
Parse email and create task.

**Request:**
```json
{
  "email_subject": "Urgent: Review contract",
  "email_body": "Please review the attached contract by EOD",
  "from_email": "client@company.com",
  "email_reference": "MSG-12345"
}
```

### GET /integrations/export/tasks
Export tasks to CSV or JSON.

**Query Parameters:**
- `format`: csv | json (default: json)

**Response:** CSV file download or JSON array

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "errors": [
    {
      "field": "priority",
      "message": "Must be one of: High, Medium, Low"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Task not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

No rate limiting currently implemented. Consider adding for production.

## Webhooks

### WhatsApp Webhook
Configure in Twilio console:
```
URL: https://yourdomain.com/api/notifications/whatsapp-webhook
Method: POST
```

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.leader@company.com","password":"password123"}'
```

### Get Tasks
```bash
curl http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Test task",
    "priority": "High",
    "responsible_person_id": 3,
    "target_date": "2024-01-20",
    "sla_type": "24hrs"
  }'
```
