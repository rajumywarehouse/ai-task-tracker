import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Filter, Send, AlertTriangle, Plus, Download } from 'lucide-react';
import { tasksAPI, usersAPI, notificationsAPI, integrationsAPI } from '../services/api';
import { toast } from 'react-toastify';
import useStore from '../store/useStore';
import TaskModal from './TaskModal';

const TaskGrid = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filters, setFilters] = useState({});
    const user = useStore((state) => state.user);

    useEffect(() => {
        loadTasks();
        loadUsers();
    }, [filters]);

    const loadTasks = async () => {
        try {
            const response = await tasksAPI.getAll(filters);
            setTasks(response.data);
        } catch (error) {
            toast.error('Failed to load tasks');
        }
    };

    const loadUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            setUsers(response.data);
        } catch (error) {
            toast.error('Failed to load users');
        }
    };

    const getRowStyle = (params) => {
        const task = params.data;
        if (task.status === 'Completed') {
            return { backgroundColor: '#e8f5e9' };
        }
        const isOverdue = new Date(task.sla_deadline) < new Date();
        if (isOverdue) {
            return { backgroundColor: '#ffebee' };
        }
        const hoursUntilDue = (new Date(task.sla_deadline) - new Date()) / (1000 * 60 * 60);
        if (hoursUntilDue < 24) {
            return { backgroundColor: '#fff3e0' };
        }
        return null;
    };

    const columnDefs = useMemo(() => [
        {
            field: 'task_id',
            headerName: 'ID',
            width: 80,
            checkboxSelection: true,
            headerCheckboxSelection: true,
            pinned: 'left'
        },
        {
            field: 'task_description',
            headerName: 'Description',
            width: 300,
            editable: true,
            cellEditor: 'agLargeTextCellEditor'
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 120,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['High', 'Medium', 'Low']
            },
            cellStyle: (params) => {
                if (params.value === 'High') return { color: '#f44336', fontWeight: 'bold' };
                if (params.value === 'Medium') return { color: '#ff9800' };
                return { color: '#4caf50' };
            }
        },
        {
            field: 'responsible_person_name',
            headerName: 'Assigned To',
            width: 180
        },
        {
            field: 'target_date',
            headerName: 'Due Date',
            width: 130,
            editable: true,
            cellEditor: 'agDateCellEditor'
        },
        {
            field: 'sla_type',
            headerName: 'SLA',
            width: 100
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Pending', 'In Progress', 'Completed', 'Delayed']
            },
            cellStyle: (params) => {
                const colors = {
                    'Completed': { backgroundColor: '#4caf50', color: 'white' },
                    'In Progress': { backgroundColor: '#2196f3', color: 'white' },
                    'Delayed': { backgroundColor: '#f44336', color: 'white' },
                    'Pending': { backgroundColor: '#ff9800', color: 'white' }
                };
                return colors[params.value] || {};
            }
        },
        {
            field: 'escalation_level',
            headerName: 'Escalation',
            width: 120,
            cellRenderer: (params) => {
                const levels = ['Level 0', 'Level 1', 'Level 2'];
                return levels[params.value] || 'Level 0';
            }
        },
        {
            field: 'remarks',
            headerName: 'Remarks',
            width: 200,
            editable: true
        },
        {
            field: 'created_date',
            headerName: 'Created',
            width: 130,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        }
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true
    }), []);

    const onCellValueChanged = useCallback(async (params) => {
        try {
            const updates = {
                [params.colDef.field]: params.newValue
            };
            await tasksAPI.update(params.data.task_id, updates);
            toast.success('Task updated successfully');
            loadTasks();
        } catch (error) {
            toast.error('Failed to update task');
            params.node.setDataValue(params.colDef.field, params.oldValue);
        }
    }, []);

    const onSelectionChanged = useCallback((event) => {
        setSelectedRows(event.api.getSelectedRows());
    }, []);

    const handleSendReminders = async () => {
        if (selectedRows.length === 0) {
            toast.warning('Please select tasks first');
            return;
        }

        try {
            const taskIds = selectedRows.map(t => t.task_id);
            await notificationsAPI.sendReminders({ task_ids: taskIds });
            toast.success(`Reminders sent for ${taskIds.length} tasks`);
        } catch (error) {
            toast.error('Failed to send reminders');
        }
    };

    const handleEscalateTasks = async () => {
        if (selectedRows.length === 0) {
            toast.warning('Please select tasks first');
            return;
        }

        try {
            const taskIds = selectedRows.map(t => t.task_id);
            await notificationsAPI.escalateTasks({ task_ids: taskIds });
            toast.success(`Escalated ${taskIds.length} tasks`);
            loadTasks();
        } catch (error) {
            toast.error('Failed to escalate tasks');
        }
    };

    const handleExport = async () => {
        try {
            const response = await integrationsAPI.exportTasks('csv');
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tasks_export.csv';
            a.click();
            toast.success('Tasks exported successfully');
        } catch (error) {
            toast.error('Failed to export tasks');
        }
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        setShowModal(true);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
                <button
                    onClick={handleCreateTask}
                    className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Task
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <select
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Delayed">Delayed</option>
                    </select>

                    <select
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                            className="rounded text-primary-500"
                        />
                        <span className="text-sm text-gray-700">Overdue Only</span>
                    </label>

                    <div className="flex-1"></div>

                    {selectedRows.length > 0 && (
                        <>
                            <button
                                onClick={handleSendReminders}
                                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send Reminders ({selectedRows.length})
                            </button>

                            <button
                                onClick={handleEscalateTasks}
                                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Escalate ({selectedRows.length})
                            </button>
                        </>
                    )}

                    <button
                        onClick={handleExport}
                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>

                <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
                    <AgGridReact
                        rowData={tasks}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        rowSelection="multiple"
                        onSelectionChanged={onSelectionChanged}
                        onCellValueChanged={onCellValueChanged}
                        getRowStyle={getRowStyle}
                        animateRows={true}
                        pagination={true}
                        paginationPageSize={20}
                    />
                </div>
            </div>

            {showModal && (
                <TaskModal
                    task={editingTask}
                    users={users}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        setShowModal(false);
                        loadTasks();
                    }}
                />
            )}
        </div>
    );
};

export default TaskGrid;
