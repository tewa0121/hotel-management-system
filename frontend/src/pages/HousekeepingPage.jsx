import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaTools, 
  FaPlus, 
  FaWrench, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaExclamationTriangle,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUser,
  FaCalendar,
  FaArrowRight
} from 'react-icons/fa';
import maintenanceService from '../services/maintenanceService';
import MaintenanceForm from '../components/maintenance/MaintenanceForm';

const MaintenancePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await maintenanceService.getRequests(filterStatus);
      setRequests(response.data || []);
    } catch (error) {
      toast.error('Failed to load maintenance requests');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance request?')) return;
    
    try {
      await maintenanceService.deleteRequest(id);
      toast.success('Request deleted successfully');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await maintenanceService.updateRequest(id, { status: newStatus });
      toast.success(`Request marked as ${newStatus.replace('_', ' ')}`);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update request status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'cancelled': return <FaTimesCircle className="text-gray-500" />;
      case 'open': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaClock className="text-yellow-500" />;
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      plumbing: '🚿',
      electrical: '💡',
      hvac: '❄️',
      furniture: '🪑',
      bathroom: '🚽',
      internet: '📶',
      appliance: '🔌',
      structural: '🏗️',
      other: '🔧'
    };
    return icons[category] || '🔧';
  };

  const getStatusActions = (status) => {
    const actions = {
      open: { next: 'assigned', label: 'Assign', color: 'btn-primary' },
      assigned: { next: 'in_progress', label: 'Start', color: 'btn-primary' },
      in_progress: { next: 'completed', label: 'Complete', color: 'btn-primary' },
      completed: { next: null, label: null, color: null },
      cancelled: { next: null, label: null, color: null }
    };
    return actions[status] || { next: null, label: null, color: null };
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchSearch = req.room_number?.includes(search) || 
                        req.description?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Stats
  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    inProgress: requests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-1">Manage and track maintenance requests</p>
        </div>
        <button 
          onClick={() => {
            setEditingRequest(null);
            setShowForm(true);
          }}
          className="mt-3 sm:mt-0 btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          New Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaTools className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FaExclamationTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by room or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button 
            onClick={fetchRequests}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading maintenance requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card text-center py-12">
          <FaTools className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No maintenance requests found</p>
          <p className="text-gray-400 text-sm">Create a new maintenance request</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const action = getStatusActions(request.status);
            return (
              <div key={request.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">
                      {getCategoryIcon(request.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          Room {request.room_number}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{request.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="capitalize">{request.category}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FaCalendar className="h-3 w-3" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        {request.assigned_to_name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FaUser className="h-3 w-3" />
                              {request.assigned_to_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status.replace('_', ' ')}</span>
                    </span>

                    {/* Quick Action Button */}
                    {action.next && (
                      <button
                        onClick={() => handleStatusUpdate(request.id, action.next)}
                        className={`${action.color} text-xs py-1 px-2 flex items-center gap-1`}
                        title={action.label}
                      >
                        <FaArrowRight className="h-2 w-2" />
                        {action.label}
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setEditingRequest(request);
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Maintenance Form Modal */}
      {showForm && (
        <MaintenanceForm
          request={editingRequest}
          onClose={() => {
            setShowForm(false);
            setEditingRequest(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRequest(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

export default MaintenancePage;