import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import housekeepingService from '../../services/housekeepingService';
import roomService from '../../services/roomService';

const TaskForm = ({ task, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    room_id: '',
    assigned_to: '',
    priority: 'normal',
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    fetchRooms();
    fetchStaff();
    if (task) {
      setFormData({
        room_id: task.room_id || '',
        assigned_to: task.assigned_to || '',
        priority: task.priority || 'normal',
        status: task.status || 'pending',
        notes: task.notes || ''
      });
    }
  }, [task]);

  const fetchRooms = async () => {
    try {
      const response = await roomService.getRooms();
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      // TODO: Fetch staff/users with housekeeping role
      setStaff([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Mike Johnson' },
        { id: 4, name: 'Sarah Wilson' },
      ]);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.room_id) {
      toast.error('Please select a room');
      return;
    }

    setLoading(true);
    try {
      if (task) {
        await housekeepingService.updateTask(task.id, formData);
        toast.success('Task updated successfully');
      } else {
        await housekeepingService.createTask(formData);
        toast.success('Task created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {task ? 'Edit Task' : 'New Housekeeping Task'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room <span className="text-red-500">*</span>
            </label>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select Room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} - {room.room_type_name || 'Standard'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="input-field"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="cleaning">Cleaning</option>
              <option value="completed">Completed</option>
              <option value="inspected">Inspected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Add any special instructions..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (task ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;