import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import maintenanceService from '../../services/maintenanceService';
import roomService from '../../services/roomService';
import userService from '../../services/userService';

const MaintenanceForm = ({ request, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    room_id: '',
    category: 'plumbing',
    description: '',
    priority: 'medium',
    assigned_to: '',
    status: 'open',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    if (request) {
      setFormData({
        room_id: request.room_id || '',
        category: request.category || 'plumbing',
        description: request.description || '',
        priority: request.priority || 'medium',
        assigned_to: request.assigned_to || '',
        status: request.status || 'open',
        notes: request.notes || ''
      });
    }
  }, [request]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch rooms and staff in parallel
      const [roomsRes, staffData] = await Promise.all([
        roomService.getRooms(),
        userService.getStaff()
      ]);

      setRooms(roomsRes.data || []);
      
      // Make sure staff is an array
      const staffArray = Array.isArray(staffData) ? staffData : [];
      setStaff(staffArray);
      
      console.log('✅ Rooms loaded:', roomsRes.data?.length || 0);
      console.log('✅ Staff loaded:', staffArray.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setStaff([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.room_id || !formData.description) {
      toast.error('Room and description are required');
      return;
    }

    setLoading(true);
    try {
      if (request) {
        await maintenanceService.updateRequest(request.id, formData);
        toast.success('Request updated successfully');
      } else {
        await maintenanceService.createRequest(formData);
        toast.success('Request created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save request');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {request ? 'Edit Request' : 'New Maintenance Request'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Room Selection */}
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="furniture">Furniture</option>
              <option value="bathroom">Bathroom</option>
              <option value="internet">Internet</option>
              <option value="appliance">Appliance</option>
              <option value="structural">Structural</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Describe the issue..."
              required
            />
          </div>

          {/* Priority */}
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
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Assign To */}
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
              {Array.isArray(staff) && staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.role && `(${member.role})`}
                </option>
              ))}
            </select>
            {(!staff || staff.length === 0) && (
              <p className="text-xs text-yellow-600 mt-1">
                No staff available. Add maintenance staff first.
              </p>
            )}
          </div>

          {/* Status */}
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
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="input-field"
              placeholder="Additional notes..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (request ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;