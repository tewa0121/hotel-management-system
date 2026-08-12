import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaHotel, 
  FaBuilding, 
  FaPhone, 
  FaEnvelope, 
  FaGlobe, 
  FaClock,
  FaMoneyBillWave,
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSave,
  FaHistory,
  FaUserPlus,
  FaUserCog
} from 'react-icons/fa';
import settingsService from '../services/settingsService';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('hotel');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    hotel_name: '',
    hotel_address: '',
    hotel_phone: '',
    hotel_email: '',
    currency: 'USD',
    timezone: 'UTC',
    check_in_time: '14:00',
    check_out_time: '11:00',
    tax_rate: 12,
    service_charge: 5,
    default_currency: 'USD'
  });
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist'
  });

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchAuditLogs();
  }, []);

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
    try {
      const response = await settingsService.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await settingsService.getAuditLogs(50);
      if (response.success) {
        setAuditLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await settingsService.updateSettings(settings);
      toast.success('Settings saved successfully');
      fetchAuditLogs(); // Refresh logs after saving
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await settingsService.updateUser(editingUser.id, userFormData);
        toast.success('User updated successfully');
      } else {
        await settingsService.createUser(userFormData);
        toast.success('User created successfully');
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserFormData({ name: '', email: '', password: '', role: 'receptionist' });
      fetchUsers();
      fetchAuditLogs(); // Refresh logs after user action
    } catch (error) {
      toast.error(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await settingsService.deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchAuditLogs(); // Refresh logs after user action
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      receptionist: 'bg-green-100 text-green-800',
      housekeeping: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-orange-100 text-orange-800',
      accountant: 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // ✅ FIXED: Get action color for audit logs
  const getActionColor = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      CHECK_IN: 'bg-purple-100 text-purple-800',
      CHECK_OUT: 'bg-orange-100 text-orange-800',
      LOGIN: 'bg-indigo-100 text-indigo-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      CANCEL: 'bg-red-100 text-red-800',
      REFUND: 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  // ✅ FIXED: Format date helper
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return date;
    }
  };

  const tabs = [
    { id: 'hotel', label: 'Hotel Settings', icon: FaHotel },
    { id: 'users', label: 'User Management', icon: FaUsers },
    { id: 'audit', label: 'Audit Logs', icon: FaHistory }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure hotel settings and manage users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hotel Settings Tab */}
      {activeTab === 'hotel' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotel Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hotel Name
              </label>
              <div className="relative">
                <FaHotel className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="hotel_name"
                  value={settings.hotel_name || ''}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="hotel_address"
                  value={settings.hotel_address || ''}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="hotel_phone"
                  value={settings.hotel_phone || ''}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="hotel_email"
                  value={settings.hotel_email || ''}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <div className="relative">
                <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="currency"
                  value={settings.currency || 'USD'}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="ETB">ETB - Ethiopian Birr</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <div className="relative">
                <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="timezone"
                  value={settings.timezone || 'UTC'}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Africa/Addis_Ababa">East Africa Time</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in Time
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  name="check_in_time"
                  value={settings.check_in_time || '14:00'}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out Time
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  name="check_out_time"
                  value={settings.check_out_time || '11:00'}
                  onChange={handleSettingsChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="tax_rate"
                value={settings.tax_rate || 12}
                onChange={handleSettingsChange}
                className="input-field"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Charge (%)
              </label>
              <input
                type="number"
                name="service_charge"
                value={settings.service_charge || 5}
                onChange={handleSettingsChange}
                className="input-field"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <FaSave />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormData({ name: '', email: '', password: '', role: 'receptionist' });
                setShowUserForm(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <FaUserPlus />
              Add User
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setUserFormData({
                            name: user.name,
                            email: user.email,
                            password: '',
                            role: user.role
                          });
                          setShowUserForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ FIXED: Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Entity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      No audit logs found. Perform actions to generate logs.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, index) => (
                    <tr key={log.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {log.user_name || 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 capitalize">
                        {log.entity || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => setShowUserForm(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'New Password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="input-field"
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
                <button type="button" onClick={() => setShowUserForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
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