import React, { useState } from 'react';
import { Save, User, Bell, Shield, Clock, Mail, MessageSquare, Database, Cpu } from 'lucide-react';
import useStore from '../store/useStore';
import { toast } from 'react-toastify';

const SettingsPage = () => {
    const user = useStore((state) => state.user);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        role: user?.role || ''
    });

    const [notifications, setNotifications] = useState({
        emailReminders: true,
        whatsappReminders: true,
        escalationAlerts: true,
        dailyDigest: true,
        weeklyReport: true
    });

    const [slaSettings, setSlaSettings] = useState({
        default_sla: '24hrs',
        escalation_level1_days: 1,
        escalation_level2_days: 3,
        auto_escalate: true,
        reminder_before_due: 1
    });

    const [aiSettings, setAiSettings] = useState({
        ai_reminders: true,
        ai_summaries: true,
        ai_suggestions: true,
        summary_frequency: 'daily'
    });

    const handleSaveProfile = () => {
        toast.success('Profile settings saved successfully');
    };

    const handleSaveNotifications = () => {
        toast.success('Notification preferences saved');
    };

    const handleSaveSLA = () => {
        toast.success('SLA settings saved');
    };

    const handleSaveAI = () => {
        toast.success('AI settings saved');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
            </div>

            {/* Profile Settings */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex items-center space-x-3 p-4 border-b">
                    <User className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+1234567890"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <input
                                type="text"
                                value={profile.role}
                                disabled
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveProfile}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Profile</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex items-center space-x-3 p-4 border-b">
                    <Bell className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
                </div>
                <div className="p-4 space-y-4">
                    {[
                        { key: 'emailReminders', icon: Mail, label: 'Email Reminders', desc: 'Receive task reminders via email' },
                        { key: 'whatsappReminders', icon: MessageSquare, label: 'WhatsApp Reminders', desc: 'Receive task reminders via WhatsApp' },
                        { key: 'escalationAlerts', icon: Shield, label: 'Escalation Alerts', desc: 'Get notified when tasks are escalated' },
                        { key: 'dailyDigest', icon: Clock, label: 'Daily Digest', desc: 'Receive a daily summary of pending tasks' },
                        { key: 'weeklyReport', icon: Database, label: 'Weekly Report', desc: 'Receive a weekly SLA compliance report' }
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.key} className="flex items-center justify-between py-2">
                                <div className="flex items-center space-x-3">
                                    <Icon className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.key]}
                                        onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                </label>
                            </div>
                        );
                    })}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveNotifications}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Notifications</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* SLA Settings */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex items-center space-x-3 p-4 border-b">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-800">SLA & Escalation</h2>
                </div>
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default SLA</label>
                            <select
                                value={slaSettings.default_sla}
                                onChange={(e) => setSlaSettings({ ...slaSettings, default_sla: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="24hrs">24 Hours</option>
                                <option value="48hrs">48 Hours</option>
                                <option value="72hrs">72 Hours</option>
                                <option value="1week">1 Week</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Before Due (days)</label>
                            <input
                                type="number"
                                min="0"
                                max="7"
                                value={slaSettings.reminder_before_due}
                                onChange={(e) => setSlaSettings({ ...slaSettings, reminder_before_due: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Escalation to Manager (days overdue)</label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={slaSettings.escalation_level1_days}
                                onChange={(e) => setSlaSettings({ ...slaSettings, escalation_level1_days: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Escalation to Leader (days overdue)</label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={slaSettings.escalation_level2_days}
                                onChange={(e) => setSlaSettings({ ...slaSettings, escalation_level2_days: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="text-sm font-medium text-gray-800">Auto-Escalate</p>
                            <p className="text-xs text-gray-500">Automatically escalate tasks when SLA is breached</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={slaSettings.auto_escalate}
                                onChange={(e) => setSlaSettings({ ...slaSettings, auto_escalate: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveSLA}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save SLA Settings</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Settings */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex items-center space-x-3 p-4 border-b">
                    <Cpu className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-800">AI Configuration</h2>
                </div>
                <div className="p-4 space-y-4">
                    {[
                        { key: 'ai_reminders', label: 'AI-Generated Reminders', desc: 'Use AI to create personalized reminder messages' },
                        { key: 'ai_summaries', label: 'AI Executive Summaries', desc: 'Generate AI-powered insights on the dashboard' },
                        { key: 'ai_suggestions', label: 'AI Task Suggestions', desc: 'Get AI recommendations for task management' }
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={aiSettings[item.key]}
                                    onChange={(e) => setAiSettings({ ...aiSettings, [item.key]: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                            </label>
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Summary Frequency</label>
                        <select
                            value={aiSettings.summary_frequency}
                            onChange={(e) => setAiSettings({ ...aiSettings, summary_frequency: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="manual">Manual Only</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveAI}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save AI Settings</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-lg shadow">
                <div className="flex items-center space-x-3 p-4 border-b">
                    <Database className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-800">System Information</h2>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Version</span>
                            <span className="font-medium text-gray-800">1.0.0</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Mode</span>
                            <span className="font-medium text-green-600">Static Data (Demo)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">AI Engine</span>
                            <span className="font-medium text-gray-800">Mock (Fallback)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Notifications</span>
                            <span className="font-medium text-gray-800">Mock (Console)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Database</span>
                            <span className="font-medium text-gray-800">In-Memory Mock</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Logged in as</span>
                            <span className="font-medium text-gray-800">{user?.name} ({user?.role})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
