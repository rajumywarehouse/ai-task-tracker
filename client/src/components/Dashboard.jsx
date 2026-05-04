import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users, Zap } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { toast } from 'react-toastify';

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336'];

const Dashboard = () => {
    const [metrics, setMetrics] = useState({});
    const [tasksByStatus, setTasksByStatus] = useState([]);
    const [tasksByPriority, setTasksByPriority] = useState([]);
    const [tasksByPerson, setTasksByPerson] = useState([]);
    const [slaCompliance, setSlaCompliance] = useState({});
    const [aiSummary, setAiSummary] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [metricsRes, statusRes, priorityRes, personRes, slaRes, aiRes] = await Promise.all([
                dashboardAPI.getMetrics(),
                dashboardAPI.getTasksByStatus(),
                dashboardAPI.getTasksByPriority(),
                dashboardAPI.getTasksByPerson(),
                dashboardAPI.getSLACompliance(),
                dashboardAPI.getAISummary()
            ]);

            setMetrics(metricsRes.data);
            setTasksByStatus(statusRes.data);
            setTasksByPriority(priorityRes.data);
            setTasksByPerson(personRes.data);
            setSlaCompliance(slaRes.data);
            setAiSummary(aiRes.data.summary);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <button
                    onClick={loadDashboardData}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Tasks"
                    value={metrics.total_tasks || 0}
                    icon={<Clock className="w-6 h-6" />}
                    color="bg-blue-500"
                />
                <MetricCard
                    title="Pending"
                    value={metrics.pending || 0}
                    icon={<AlertCircle className="w-6 h-6" />}
                    color="bg-yellow-500"
                />
                <MetricCard
                    title="Completed"
                    value={metrics.completed || 0}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="bg-green-500"
                />
                <MetricCard
                    title="SLA Breaches"
                    value={metrics.sla_breaches || 0}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="bg-red-500"
                />
            </div>

            {aiSummary && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <Zap className="w-6 h-6 text-purple-600 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Insights</h3>
                            <p className="text-gray-700 whitespace-pre-line">{aiSummary}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={tasksByStatus}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {tasksByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={tasksByPriority}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="priority" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#2196f3" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Team Workload
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tasks</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasksByPerson.map((person, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {person.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {person.task_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                        {person.completed}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        {person.overdue}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">SLA Compliance</h3>
                <div className="flex items-center justify-around">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">
                            {slaCompliance.within_sla || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Within SLA</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-red-600">
                            {slaCompliance.breached || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Breached</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-primary-600">
                            {slaCompliance.within_sla && slaCompliance.breached
                                ? Math.round((slaCompliance.within_sla / (slaCompliance.within_sla + slaCompliance.breached)) * 100)
                                : 0}%
                        </div>
                        <div className="text-sm text-gray-600 mt-2">Compliance Rate</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`${color} p-3 rounded-lg text-white`}>
                {icon}
            </div>
        </div>
    </div>
);

export default Dashboard;
