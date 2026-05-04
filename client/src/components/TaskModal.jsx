import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { tasksAPI } from '../services/api';
import { toast } from 'react-toastify';

const TaskModal = ({ task, users, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        task_description: '',
        priority: 'Medium',
        responsible_person_id: '',
        target_date: '',
        sla_type: '24hrs',
        custom_sla_hours: '',
        auto_reminder: true,
        remarks: ''
    });

    useEffect(() => {
        if (task) {
            setFormData({
                task_description: task.task_description || '',
                priority: task.priority || 'Medium',
                responsible_person_id: task.responsible_person_id || '',
                target_date: task.target_date || '',
                sla_type: task.sla_type || '24hrs',
                custom_sla_hours: '',
                auto_reminder: task.auto_reminder !== false,
                remarks: task.remarks || ''
            });
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (task) {
                await tasksAPI.update(task.task_id, formData);
                toast.success('Task updated successfully');
            } else {
                await tasksAPI.create(formData);
                toast.success('Task created successfully');
            }
            onSave();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {task ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Description *
                        </label>
                        <textarea
                            name="task_description"
                            value={formData.task_description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priority *
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assigned To *
                            </label>
                            <select
                                name="responsible_person_id"
                                value={formData.responsible_person_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select Person</option>
                                {users.map(user => (
                                    <option key={user.user_id} value={user.user_id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Date *
                            </label>
                            <input
                                type="date"
                                name="target_date"
                                value={formData.target_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SLA Type *
                            </label>
                            <select
                                name="sla_type"
                                value={formData.sla_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                            >
                                <option value="24hrs">24 Hours</option>
                                <option value="48hrs">48 Hours</option>
                                <option value="72hrs">72 Hours</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                    </div>

                    {formData.sla_type === 'Custom' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom SLA (Hours)
                            </label>
                            <input
                                type="number"
                                name="custom_sla_hours"
                                value={formData.custom_sla_hours}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                min="1"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remarks
                        </label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="auto_reminder"
                            checked={formData.auto_reminder}
                            onChange={handleChange}
                            className="rounded text-primary-500 mr-2"
                        />
                        <label className="text-sm text-gray-700">
                            Enable Auto Reminders
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            {task ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
