import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import settingsService from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import {
    FaSave,
    FaSpinner,
    FaHotel,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaGlobe,
    FaClock,
    FaUsers,
    FaUserPlus,
    FaEdit,
    FaTrash,
    FaHistory,
    FaTimes,
    FaCheck,
    FaUserCog,
    FaImage
} from 'react-icons/fa';

const SettingsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('settings');

    // Settings state
    const [settings, setSettings] = useState({
        hotel_name: '',
        hotel_address: '',
        hotel_phone: '',
        hotel_email: '',
        hotel_logo: '',
        currency: 'USD',
        timezone: 'UTC',
        check_in_time: '14:00',
        check_out_time: '11:00',
        tax_rate: 12.00,
        service_charge: 5.00,
        default_currency: 'USD'
    });

    // Users state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'receptionist'
    });
    const [userSubmitting, setUserSubmitting] = useState(false);

    // Audit logs state
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await fetchSettings();
            await fetchUsers();
            await fetchAuditLogs();
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await settingsService.getSettings();
            if (response.success) {
                setSettings(response.data);
            }
        } catch (error) {
            toast.error('Failed to load settings');
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await settingsService.getUsers();
            if (response.success) {
                setUsers(response.data || []);
            }
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        setAuditLoading(true);
        try {
            const response = await settingsService.getAuditLogs(100);
            if (response.success) {
                setAuditLogs(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setAuditLoading(false);
        }
    };

    // ========== SETTINGS HANDLERS ==========
    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await settingsService.updateSettings(settings);
            if (response.success) {
                toast.success('Settings updated successfully');
                setSettings(response.data);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    // ========== USER HANDLERS ==========
    const openUserModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({
                name: user.name || '',
                email: user.email || '',
                password: '',
                role: user.role || 'receptionist'
            });
        } else {
            setEditingUser(null);
            setUserForm({
                name: '',
                email: '',
                password: '',
                role: 'receptionist'
            });
        }
        setShowUserModal(true);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        if (!userForm.name || !userForm.email) {
            toast.error('Name and email are required');
            return;
        }
        if (!editingUser && !userForm.password) {
            toast.error('Password is required for new users');
            return;
        }

        setUserSubmitting(true);
        try {
            if (editingUser) {
                await settingsService.updateUser(editingUser.id, userForm);
                toast.success('User updated successfully');
            } else {
                await settingsService.createUser(userForm);
                toast.success('User created successfully');
            }
            setShowUserModal(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to save user');
        } finally {
            setUserSubmitting(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        if (id === user?.id) {
            toast.error('You cannot delete your own account');
            return;
        }
        try {
            await settingsService.deleteUser(id);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to delete user');
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            admin: 'bg-red-100 text-red-800',
            manager: 'bg-blue-100 text-blue-800',
            receptionist: 'bg-green-100 text-green-800',
            housekeeping: 'bg-yellow-100 text-yellow-800',
            maintenance: 'bg-purple-100 text-purple-800',
            accountant: 'bg-indigo-100 text-indigo-800'
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    // ========== RENDER ==========
    if (loading) {
        return <div className="text-center py-12">Loading settings...</div>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage hotel configuration, users, and audit logs</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'settings'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaHotel /> Settings
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'users'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaUsers /> Users
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'audit'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaHistory /> Audit Logs
                </button>
            </div>

            {/* ============================================ */}
            {/* TAB 1: SETTINGS */}
            {/* ============================================ */}
            {activeTab === 'settings' && (
                <form onSubmit={handleSettingsSubmit} className="max-w-4xl">
                    <div className="card">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Hotel Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaHotel className="inline mr-1" /> Hotel Name
                                </label>
                                <input
                                    type="text"
                                    name="hotel_name"
                                    value={settings.hotel_name || ''}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                    placeholder="My Hotel"
                                />
                            </div>

                            {/* Hotel Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaEnvelope className="inline mr-1" /> Hotel Email
                                </label>
                                <input
                                    type="email"
                                    name="hotel_email"
                                    value={settings.hotel_email || ''}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                    placeholder="info@hotel.com"
                                />
                            </div>

                            {/* Hotel Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaPhone className="inline mr-1" /> Hotel Phone
                                </label>
                                <input
                                    type="text"
                                    name="hotel_phone"
                                    value={settings.hotel_phone || ''}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                    placeholder="+251 920 954 224"
                                />
                            </div>

                            {/* Hotel Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaMapMarkerAlt className="inline mr-1" /> Hotel Address
                                </label>
                                <input
                                    type="text"
                                    name="hotel_address"
                                    value={settings.hotel_address || ''}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                    placeholder="123 Main Street, City"
                                />
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaGlobe className="inline mr-1" /> Currency
                                </label>
                                <select
                                    name="currency"
                                    value={settings.currency || 'USD'}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="ETB">ETB (Br)</option>
                                </select>
                            </div>

                            {/* Timezone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaClock className="inline mr-1" /> Timezone
                                </label>
                                <select
                                    name="timezone"
                                    value={settings.timezone || 'UTC'}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="Africa/Addis_Ababa">Addis Ababa</option>
                                    <option value="America/New_York">New York</option>
                                    <option value="Europe/London">London</option>
                                    <option value="Asia/Dubai">Dubai</option>
                                </select>
                            </div>

                            {/* Check-in Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Check-in Time
                                </label>
                                <input
                                    type="time"
                                    name="check_in_time"
                                    value={settings.check_in_time || '14:00'}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                />
                            </div>

                            {/* Check-out Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Check-out Time
                                </label>
                                <input
                                    type="time"
                                    name="check_out_time"
                                    value={settings.check_out_time || '11:00'}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                />
                            </div>

                            {/* Tax Rate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax Rate (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="tax_rate"
                                    value={settings.tax_rate || 0}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                />
                            </div>

                            {/* Service Charge */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Service Charge (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="service_charge"
                                    value={settings.service_charge || 0}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                />
                            </div>

                            {/* Default Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Default Currency
                                </label>
                                <select
                                    name="default_currency"
                                    value={settings.default_currency || 'USD'}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="ETB">ETB (Br)</option>
                                </select>
                            </div>

                            {/* Logo URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FaImage className="inline mr-1" /> Logo URL
                                </label>
                                <input
                                    type="text"
                                    name="hotel_logo"
                                    value={settings.hotel_logo || ''}
                                    onChange={handleSettingsChange}
                                    className="input-field"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* ============================================ */}
            {/* TAB 2: USERS */}
            {/* ============================================ */}
            {activeTab === 'users' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-600">Manage staff users and roles</p>
                        <button
                            onClick={() => openUserModal()}
                            className="btn-primary flex items-center gap-2"
                        >
                            <FaUserPlus /> Add User
                        </button>
                    </div>

                    {usersLoading ? (
                        <div className="text-center py-8">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="card text-center py-8 text-gray-500">No users found</div>
                    ) : (
                        <div className="card overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="py-3 px-4 font-medium text-gray-900">{u.name}</td>
                                            <td className="py-3 px-4 text-gray-600">{u.email}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(u.role)}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openUserModal(u)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    {u.id !== user?.id && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* TAB 3: AUDIT LOGS */}
            {/* ============================================ */}
            {activeTab === 'audit' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-600">System activity log</p>
                        <button
                            onClick={fetchAuditLogs}
                            className="btn-secondary text-sm"
                        >
                            Refresh
                        </button>
                    </div>

                    {auditLoading ? (
                        <div className="text-center py-8">Loading audit logs...</div>
                    ) : auditLogs.length === 0 ? (
                        <div className="card text-center py-8 text-gray-500">No audit logs found</div>
                    ) : (
                        <div className="card overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Entity</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                                {log.user_name || 'System'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                                    log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                    log.action === 'REFUND' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                                                {log.entity}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                                                {log.entity_id ? `ID: ${log.entity_id}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* USER MODAL */}
            {/* ============================================ */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingUser ? 'Edit User' : 'Add User'}
                            </h2>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FaTimes className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    className="input-field"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    className="input-field"
                                    placeholder="john@hotel.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {!editingUser && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    className="input-field"
                                    placeholder={editingUser ? 'Leave blank to keep current' : '********'}
                                    required={!editingUser}
                                    minLength={6}
                                />
                                {editingUser && (
                                    <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="receptionist">Receptionist</option>
                                    <option value="housekeeping">Housekeeping</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="accountant">Accountant</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowUserModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={userSubmitting}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {userSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                    {userSubmitting ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;