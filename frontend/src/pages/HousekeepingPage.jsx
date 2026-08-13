import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaBroom, 
  FaCheckCircle, 
  FaClock, 
  FaUser, 
  FaPlus, 
  FaSearch,
  FaExclamationTriangle,
  FaUserCheck,
  FaEdit,
  FaTrash,
  FaArrowRight
} from 'react-icons/fa';
import housekeepingService from '../services/housekeepingService';
import TaskForm from '../components/housekeeping/TaskForm';

const HousekeepingPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  // ✅ FIXED: fetchTasks with better error handling
  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching housekeeping tasks with status:', filterStatus);
      
      const response = await housekeepingService.getTasks(filterStatus);
      console.log('📥 Response data:', response);
      
      if (response && response.success) {
        setTasks(response.data || []);
        console.log('✅ Loaded', response.data?.length || 0, 'tasks');
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setTasks([]);
      }
    } catch (error) {
      console.error('❌ Error fetching housekeeping tasks:', error);
      toast.error('Failed to load housekeeping tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await housekeepingService.deleteTask(id);
      toast.success('Task deleted successfully');
      await fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  // ✅ FIXED: handleStatusUpdate with better error handling
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      console.log(`🔄 Updating housekeeping ${id} to status: ${newStatus}`);
      
      const response = await housekeepingService.updateTask(id, { status: newStatus });
      
      if (response && response.success) {
        toast.success(`Task marked as ${newStatus}`);
        await fetchTasks();
      } else {
        toast.error(response?.message || 'Failed to update task status');
        console.error('❌ Update failed:', response);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      toast.error(error.message || 'Failed to update task status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      inspected: 'bg-indigo-100 text-indigo-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'assigned': return <FaUserCheck className="text-blue-500" />;
      case 'cleaning': return <FaBroom className="text-purple-500" />;
      default: return <FaClock className="text-yellow-500" />;
    }
  };

  // Get the next action for each status
  const getNextAction = (status) => {
    const actions = {
      pending: { next: 'assigned', label: 'Assign', color: 'bg-blue-600 hover:bg-blue-700' },
      assigned: { next: 'cleaning', label: 'Start', color: 'bg-purple-600 hover:bg-purple-700' },
      cleaning: { next: 'completed', label: 'Complete', color: 'bg-green-600 hover:bg-green-700' },
      completed: { next: 'inspected', label: 'Inspect', color: 'bg-indigo-600 hover:bg-indigo-700' },
      inspected: null,
    };
    return actions[status] || null;
  };

  // Filter tasks by search
  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.room_number?.includes(search) || 
                        task.assigned_to_name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'assigned' || t.status === 'cleaning').length,
    completed: tasks.filter(t => t.status === 'completed' || t.status === 'inspected').length
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
          <p className="text-gray-600 mt-1">Manage cleaning tasks and assignments</p>
        </div>
        <button 
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          className="mt-3 sm:mt-0 btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          New Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaBroom className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaBroom className="h-5 w-5 text-purple-600" />
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
              placeholder="Search by room number or staff..."
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
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="cleaning">Cleaning</option>
              <option value="completed">Completed</option>
              <option value="inspected">Inspected</option>
            </select>
          </div>
          <button 
            onClick={fetchTasks}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card text-center py-12">
          <FaBroom className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No housekeeping tasks</p>
          <p className="text-gray-400 text-sm">Create a new task or wait for checkouts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const action = getNextAction(task.status);
            return (
              <div key={task.id} className="card hover:shadow-lg transition-shadow border-l-4 border-l-transparent hover:border-l-primary-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">
                      {getStatusIcon(task.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          Room {task.room_number}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority || 'Normal'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                        {task.assigned_to_name ? (
                          <span className="flex items-center gap-1">
                            <FaUser className="h-3 w-3" />
                            {task.assigned_to_name}
                          </span>
                        ) : (
                          <span className="text-yellow-600">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      <span className="capitalize">{task.status}</span>
                    </span>

                    {/* Quick Action Button */}
                    {action && (
                      <button
                        onClick={() => handleStatusUpdate(task.id, action.next)}
                        className={`${action.color} text-white text-xs py-1 px-3 rounded-lg flex items-center gap-1 transition-colors`}
                        title={action.label}
                      >
                        <FaArrowRight className="h-2 w-2" />
                        {action.label}
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(task.id)}
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

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};

export default HousekeepingPage;