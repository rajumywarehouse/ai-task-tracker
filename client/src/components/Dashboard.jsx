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

    const complianceRate = slaCompliance.within_sla && slaCompliance.breached
        ? Math.round((slaCompliance.within_sla / (slaCompliance.within_sla + slaCompliance.breached)) * 100)
        : 0;

    return (
        <div className="p-4 space-y-3 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                <button
                    onClick={loadDashboardData}
                    className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard title="Total Tasks" value={metrics.total_tasks || 0} icon={<Clock className="w-5 h-5" />} color="bg-blue-500" />
                <MetricCard title="Pending" value={metrics.pending || 0} icon={<AlertCircle className="w-5 h-5" />} color="bg-yellow-500" />
                <MetricCard title="Completed" value={metrics.completed || 0} icon={<CheckCircle className="w-5 h-5" />} color="bg-green-500" />
                <MetricCard title="SLA Breaches" value={metrics.sla_breaches || 0} icon={<TrendingUp className="w-5 h-5" />} color="bg-red-500" />
            </div>

            {aiSummary && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-4 py-3">
                    <div className="flex items-start space-x-2">
                        <Zap className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-800 mb-1">AI Insights</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-snug">{aiSummary}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg shadow p-3">
                    <h3 className="text-sm font-semibold mb-2">Tasks by Status</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={tasksByStatus}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={65}
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={false}
                                fontSize={11}
                            >
                                {tasksByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-3">
                    <h3 className="text-sm font-semibold mb-2">Tasks by Priority</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={tasksByPriority} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="priority" fontSize={11} />
                            <YAxis fontSize={11} width={30} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#2196f3" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-3">
                    <h3 className="text-sm font-semibold mb-2">SLA Compliance</h3>
                    <div className="flex items-center justify-around h-[180px]">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{slaCompliance.within_sla || 0}</div>
                            <div className="text-xs text-gray-500 mt-1">Within SLA</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-600">{slaCompliance.breached || 0}</div>
                            <div className="text-xs text-gray-500 mt-1">Breached</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary-600">{complianceRate}%</div>
                            <div className="text-xs text-gray-500 mt-1">Compliance</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-sm font-semibold mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-1.5" />
                    Team Workload
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Done</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasksByPerson.map((person, index) => {
                                const pct = person.task_count > 0 ? Math.round((person.completed / person.task_count) * 100) : 0;
                                return (
                                    <tr key={index}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{person.task_count}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600">{person.completed}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">{person.overdue}</td>
                                        <td className="px-4 py-2 whitespace-nowrap w-40">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                </div>
                                                <span className="text-xs text-gray-500 w-8">{pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow px-4 py-3">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`${color} p-2 rounded-lg text-white`}>
                {icon}
            </div>
        </div>
    </div>
);

export default Dashboard;
