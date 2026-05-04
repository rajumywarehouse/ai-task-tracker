import React, { useState, useEffect } from 'react';
import { usersAPI, authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Search, Mail, Phone, Shield, Building, ChevronDown, ChevronUp, UserPlus, X } from 'lucide-react';
import useStore from '../store/useStore';

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'Team Member',
    department_id: '',
    manager_id: ''
};

const UsersPage = () => {
    const [usersList, setUsersList] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [expandedUser, setExpandedUser] = useState(null);
    const [userTasks, setUserTasks] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const currentUser = useStore((state) => state.user);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, deptsRes] = await Promise.all([
                usersAPI.getAll(),
                usersAPI.getDepartments()
            ]);
            setUsersList(usersRes.data);
            setDepartments(deptsRes.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const toggleUserExpand = async (userId) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
            return;
        }
        setExpandedUser(userId);
        if (!userTasks[userId]) {
            try {
                const res = await usersAPI.getById(userId);
                setUserTasks(prev => ({ ...prev, [userId]: res.data }));
            } catch (error) {
                // silently fail
            }
        }
    };

    const filteredUsers = usersList.filter(u => {
        const matchesSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !roleFilter || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Leader': return 'bg-purple-100 text-purple-800';
            case 'Manager': return 'bg-blue-100 text-blue-800';
            case 'Team Member': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!addForm.name || !addForm.email || !addForm.password) {
            toast.error('Name, email, and password are required');
            return;
        }
        setSaving(true);
        try {
            await authAPI.register({
                name: addForm.name,
                email: addForm.email,
                password: addForm.password,
                phone_number: addForm.phone_number || undefined,
                role: addForm.role,
                department_id: addForm.department_id ? parseInt(addForm.department_id) : undefined,
                manager_id: addForm.manager_id ? parseInt(addForm.manager_id) : undefined
            });
            toast.success(`${addForm.name} added successfully`);
            setShowAddModal(false);
            setAddForm(EMPTY_FORM);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add user');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
                    <p className="text-gray-600 mt-1">Manage your team and view workload distribution</p>
                </div>
                {(currentUser?.role === 'Leader' || currentUser?.role === 'Manager') && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Add User</span>
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-800">{usersList.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Leaders</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {usersList.filter(u => u.role === 'Leader').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Managers</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {usersList.filter(u => u.role === 'Manager').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Team Members</p>
                    <p className="text-2xl font-bold text-green-600">
                        {usersList.filter(u => u.role === 'Team Member').length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">All Roles</option>
                        <option value="Leader">Leader</option>
                        <option value="Manager">Manager</option>
                        <option value="Team Member">Team Member</option>
                    </select>
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        No users found matching your search criteria.
                    </div>
                ) : (
                    filteredUsers.map((u) => (
                        <div key={u.user_id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleUserExpand(u.user_id)}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {u.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-gray-800">{u.name}</h3>
                                            {u.user_id === currentUser?.id && (
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">You</span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <Mail className="w-3 h-3" />
                                                <span>{u.email}</span>
                                            </span>
                                            {u.phone_number && (
                                                <span className="flex items-center space-x-1">
                                                    <Phone className="w-3 h-3" />
                                                    <span>{u.phone_number}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                                        <Building className="w-4 h-4" />
                                        <span>{u.department_name || 'No Department'}</span>
                                    </div>
                                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                                        <Shield className="w-3 h-3" />
                                        <span>{u.role}</span>
                                    </span>
                                    {expandedUser === u.user_id ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {expandedUser === u.user_id && (
                                <div className="border-t bg-gray-50 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Department</p>
                                            <p className="text-sm text-gray-800">{u.department_name || 'Not assigned'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Reports To</p>
                                            <p className="text-sm text-gray-800">{u.manager_name || 'None (Top Level)'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Role</p>
                                            <p className="text-sm text-gray-800">{u.role}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Contact</p>
                                        <div className="flex space-x-4">
                                            <a href={`mailto:${u.email}`} className="flex items-center space-x-1 text-sm text-primary-600 hover:underline">
                                                <Mail className="w-4 h-4" />
                                                <span>{u.email}</span>
                                            </a>
                                            {u.phone_number && (
                                                <span className="flex items-center space-x-1 text-sm text-gray-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{u.phone_number}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Departments Section */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Departments</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {departments.map((dept) => {
                        const deptUsers = usersList.filter(u => u.department_name === dept.name);
                        return (
                            <div key={dept.department_id} className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Building className="w-5 h-5 text-primary-500" />
                                    <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                                </div>
                                <p className="text-sm text-gray-600">{deptUsers.length} member{deptUsers.length !== 1 ? 's' : ''}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {deptUsers.map(u => (
                                        <span key={u.user_id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                            {u.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Add New User</h2>
                            <button
                                onClick={() => { setShowAddModal(false); setAddForm(EMPTY_FORM); }}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={addForm.name}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="e.g. Jane Smith"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={addForm.email}
                                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="e.g. jane@company.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={addForm.password}
                                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Min 6 characters"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={addForm.phone_number}
                                    onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    value={addForm.role}
                                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="Team Member">Team Member</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Leader">Leader</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {addForm.role === 'Leader' && 'Full access — can manage all tasks, users, and settings'}
                                    {addForm.role === 'Manager' && 'Can manage team tasks, send reminders, and escalate'}
                                    {addForm.role === 'Team Member' && 'Can view and update their own assigned tasks'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select
                                    value={addForm.department_id}
                                    onChange={(e) => setAddForm({ ...addForm, department_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.department_id} value={d.department_id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                                <select
                                    value={addForm.manager_id}
                                    onChange={(e) => setAddForm({ ...addForm, manager_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">None (Top Level)</option>
                                    {usersList
                                        .filter(u => u.role === 'Leader' || u.role === 'Manager')
                                        .map(u => (
                                            <option key={u.user_id} value={String(u.user_id)}>
                                                {u.name} — {u.role}{u.department_name ? ` (${u.department_name})` : ''}
                                            </option>
                                        ))}
                                </select>
                                {addForm.manager_id && (
                                    <p className="text-xs text-primary-600 mt-1">
                                        Selected: {usersList.find(u => String(u.user_id) === String(addForm.manager_id))?.name || 'Unknown'}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setAddForm(EMPTY_FORM); }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>{saving ? 'Adding...' : 'Add User'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
