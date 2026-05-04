import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData)
};

export const tasksAPI = {
    getAll: (params) => api.get('/tasks', { params }),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (task) => api.post('/tasks', task),
    update: (id, updates) => api.put(`/tasks/${id}`, updates),
    delete: (id) => api.delete(`/tasks/${id}`),
    bulkUpdate: (taskIds, updates) => api.post('/tasks/bulk-update', { task_ids: taskIds, updates }),
    addComment: (id, comment) => api.post(`/tasks/${id}/comments`, { comment })
};

export const usersAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, updates) => api.put(`/users/${id}`, updates),
    getDepartments: () => api.get('/users/departments/list')
};

export const dashboardAPI = {
    getMetrics: () => api.get('/dashboard/metrics'),
    getTasksByStatus: () => api.get('/dashboard/tasks-by-status'),
    getTasksByPriority: () => api.get('/dashboard/tasks-by-priority'),
    getTasksByPerson: () => api.get('/dashboard/tasks-by-person'),
    getSLACompliance: () => api.get('/dashboard/sla-compliance'),
    getAISummary: () => api.get('/dashboard/ai-summary'),
    getOverdueTasks: () => api.get('/dashboard/overdue-tasks'),
    getTeamWorkload: () => api.get('/dashboard/team-workload')
};

export const notificationsAPI = {
    sendReminders: (data) => api.post('/notifications/send-reminders', data),
    escalateTasks: (data) => api.post('/notifications/escalate-tasks', data)
};

export const integrationsAPI = {
    importFromERP: (tasks) => api.post('/integrations/erp/import', { tasks }),
    syncERPStatus: (updates) => api.post('/integrations/erp/sync-status', { updates }),
    parseEmail: (emailData) => api.post('/integrations/email/parse', emailData),
    exportTasks: (format) => api.get('/integrations/export/tasks', { params: { format } })
};

export default api;
