const mockData = require('../data/mockData');

let { users, departments, tasks, taskComments, taskHistory } = mockData;

let nextUserId = 6;
let nextTaskId = 11;
let nextCommentId = 5;
let nextHistoryId = 6;

const mockDb = {
    query: async (text, params = []) => {
        const queryLower = text.toLowerCase().trim();

        if (queryLower.includes('select') && queryLower.includes('from users') && queryLower.includes('where') && queryLower.includes('email')) {
            const email = params[0];
            let user = users.find(u => u.email === email);
            if (user && queryLower.includes('is_active') && !user.is_active) {
                user = null;
            }
            return { rows: user ? [user] : [] };
        }

        if (queryLower.includes('select') && queryLower.includes('from users') && queryLower.includes('where user_id')) {
            const userId = params[0];
            const user = users.find(u => u.user_id === parseInt(userId));
            return { rows: user ? [user] : [] };
        }

        if (queryLower.includes('select') && queryLower.includes('from users') && !queryLower.includes('where')) {
            const enrichedUsers = users.map(u => {
                const dept = departments.find(d => d.department_id === u.department_id);
                const manager = users.find(m => m.user_id === u.manager_id);
                return {
                    ...u,
                    department_name: dept?.name,
                    manager_name: manager?.name
                };
            });
            return { rows: enrichedUsers };
        }

        if (queryLower.includes('insert into users')) {
            const newUser = {
                user_id: nextUserId++,
                name: params[0],
                email: params[1],
                password_hash: params[2],
                phone_number: params[3] || null,
                manager_id: params[4] ? parseInt(params[4]) : null,
                department_id: params[5] ? parseInt(params[5]) : null,
                role: params[6] || 'Team Member',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            users.push(newUser);
            return { rows: [{ user_id: newUser.user_id, name: newUser.name, email: newUser.email, role: newUser.role }] };
        }

        if (queryLower.includes('select') && queryLower.includes('from tasks')) {
            let filteredTasks = [...tasks];

            if (queryLower.includes('where')) {
                params.forEach((param, index) => {
                    if (queryLower.includes('status')) {
                        filteredTasks = filteredTasks.filter(t => t.status === param);
                    }
                    if (queryLower.includes('priority')) {
                        filteredTasks = filteredTasks.filter(t => t.priority === param);
                    }
                    if (queryLower.includes('responsible_person_id')) {
                        filteredTasks = filteredTasks.filter(t => t.responsible_person_id === parseInt(param));
                    }
                    if (queryLower.includes('task_id =')) {
                        filteredTasks = filteredTasks.filter(t => t.task_id === parseInt(param));
                    }
                });
            }

            if (queryLower.includes('sla_deadline < now()')) {
                const now = new Date();
                filteredTasks = filteredTasks.filter(t => new Date(t.sla_deadline) < now && t.status !== 'Completed');
            }

            return { rows: filteredTasks };
        }

        if (queryLower.includes('insert into tasks')) {
            const newTask = {
                task_id: nextTaskId++,
                created_date: new Date(),
                task_description: params[0],
                priority: params[1],
                responsible_person_id: parseInt(params[2]),
                target_date: params[3],
                sla_type: params[4],
                sla_deadline: params[5],
                auto_reminder: params[6] !== false,
                escalation_level: 0,
                status: 'Pending',
                remarks: params[7],
                last_updated: new Date(),
                created_by: parseInt(params[8]),
                source: 'Manual'
            };

            const user = users.find(u => u.user_id === newTask.responsible_person_id);
            if (user) {
                newTask.responsible_person_name = user.name;
                newTask.responsible_person_email = user.email;
            }

            tasks.push(newTask);
            return { rows: [newTask] };
        }

        if (queryLower.includes('update tasks')) {
            const taskId = params[params.length - 1];
            const taskIndex = tasks.findIndex(t => t.task_id === parseInt(taskId));

            if (taskIndex !== -1) {
                if (queryLower.includes('status')) {
                    tasks[taskIndex].status = params[0];
                }
                if (queryLower.includes('priority')) {
                    tasks[taskIndex].priority = params[0];
                }
                if (queryLower.includes('remarks')) {
                    tasks[taskIndex].remarks = params[0];
                }
                if (queryLower.includes('escalation_level')) {
                    tasks[taskIndex].escalation_level = parseInt(params[0]);
                }
                tasks[taskIndex].last_updated = new Date();

                return { rows: [tasks[taskIndex]] };
            }
            return { rows: [] };
        }

        if (queryLower.includes('insert into task_comments')) {
            const newComment = {
                comment_id: nextCommentId++,
                task_id: parseInt(params[0]),
                user_id: parseInt(params[1]),
                comment: params[2],
                created_at: new Date()
            };
            taskComments.push(newComment);
            return { rows: [newComment] };
        }

        if (queryLower.includes('select') && queryLower.includes('from task_comments')) {
            const taskId = params[0];
            const comments = taskComments.filter(c => c.task_id === parseInt(taskId));
            return { rows: comments };
        }

        if (queryLower.includes('insert into task_history')) {
            const newHistory = {
                history_id: nextHistoryId++,
                task_id: parseInt(params[0]),
                user_id: params[1] ? parseInt(params[1]) : null,
                action: params[2],
                old_value: params[3],
                new_value: params[4],
                field_changed: params.length > 5 ? params[5] : null,
                timestamp: new Date()
            };
            taskHistory.push(newHistory);
            return { rows: [newHistory] };
        }

        if (queryLower.includes('select') && queryLower.includes('from task_history')) {
            const taskId = params[0];
            const history = taskHistory.filter(h => h.task_id === parseInt(taskId));
            return { rows: history };
        }

        if (queryLower.includes('from departments')) {
            return { rows: departments };
        }

        if (queryLower.includes('count(*)')) {
            const metrics = {
                total_tasks: tasks.length,
                pending: tasks.filter(t => t.status === 'Pending').length,
                in_progress: tasks.filter(t => t.status === 'In Progress').length,
                completed: tasks.filter(t => t.status === 'Completed').length,
                delayed: tasks.filter(t => t.status === 'Delayed').length,
                sla_breaches: tasks.filter(t => new Date(t.sla_deadline) < new Date() && t.status !== 'Completed').length,
                high_priority_pending: tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length
            };
            return { rows: [metrics] };
        }

        if (queryLower.includes('group by status')) {
            const statusCounts = {};
            tasks.forEach(t => {
                statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
            });
            const rows = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
            return { rows };
        }

        if (queryLower.includes('group by priority')) {
            const priorityCounts = {};
            tasks.filter(t => t.status !== 'Completed').forEach(t => {
                priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
            });
            const rows = Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }));
            return { rows };
        }

        if (queryLower.includes('group by u.user_id')) {
            const userTasks = {};
            tasks.forEach(t => {
                if (!userTasks[t.responsible_person_id]) {
                    userTasks[t.responsible_person_id] = {
                        name: t.responsible_person_name,
                        task_count: 0,
                        completed: 0,
                        overdue: 0
                    };
                }
                userTasks[t.responsible_person_id].task_count++;
                if (t.status === 'Completed') {
                    userTasks[t.responsible_person_id].completed++;
                }
                if (new Date(t.sla_deadline) < new Date() && t.status !== 'Completed') {
                    userTasks[t.responsible_person_id].overdue++;
                }
            });
            const rows = Object.values(userTasks).filter(u => u.task_count > 0);
            return { rows };
        }

        if (queryLower.includes('within_sla') || queryLower.includes('breached')) {
            const now = new Date();
            const within_sla = tasks.filter(t => new Date(t.sla_deadline) >= now || t.status === 'Completed').length;
            const breached = tasks.filter(t => new Date(t.sla_deadline) < now && t.status !== 'Completed').length;
            return { rows: [{ within_sla, breached }] };
        }

        return { rows: [] };
    },

    pool: {
        on: () => {},
        query: async (text, params) => mockDb.query(text, params)
    }
};

module.exports = mockDb;
