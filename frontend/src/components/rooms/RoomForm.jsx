import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import roomService from '../../services/roomService';

const RoomForm = ({ room, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type_id: '',
    floor: 1,
    building: 'Main',
    status: 'available',
    housekeeping_status: 'clean',
    price_override: '',
    amenities: '',
    notes: ''
  });

  useEffect(() => {
    fetchRoomTypes();
    if (room) {
      setFormData({
        room_number: room.room_number || '',
        room_type_id: room.room_type_id || '',
        floor: room.floor || 1,
        building: room.building || 'Main',
        status: room.status || 'available',
        housekeeping_status: room.housekeeping_status || 'clean',
        price_override: room.price_override || '',
        amenities: room.amenities || '',
        notes: room.notes || ''
      });
    }
  }, [room]);

  const fetchRoomTypes = async () => {
    try {
      const response = await roomService.getRoomTypes();
      setRoomTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching room types:', error);
      toast.error('Failed to load room types');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.room_number || !formData.room_type_id) {
      toast.error('Room number and room type are required');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        price_override: formData.price_override ? parseFloat(formData.price_override) : null
      };

      if (room) {
        await roomService.updateRoom(room.id, data);
        toast.success('Room updated successfully');
      } else {
        await roomService.createRoom(data);
        toast.success('Room created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {room ? 'Edit Room' : 'Add New Room'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="room_number"
                value={formData.room_number}
                onChange={handleChange}
                className="input-field"
                placeholder="101"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Type <span className="text-red-500">*</span>
              </label>
              <select
                name="room_type_id"
                value={formData.room_type_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Room Type</option>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - ${type.base_price}/night
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                className="input-field"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleChange}
                className="input-field"
                placeholder="Main"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="dirty">Dirty</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Housekeeping Status</label>
              <select
                name="housekeeping_status"
                value={formData.housekeeping_status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="cleaning">Cleaning</option>
                <option value="inspected">Inspected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Override</label>
              <input
                type="number"
                name="price_override"
                value={formData.price_override}
                onChange={handleChange}
                className="input-field"
                placeholder="Leave empty to use default"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
              <input
                type="text"
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                className="input-field"
                placeholder="TV, WiFi, AC, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="input-field"
                placeholder="Any special notes about this room"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (room ? 'Update Room' : 'Create Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomForm;