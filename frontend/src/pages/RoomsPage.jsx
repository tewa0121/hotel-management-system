import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaBed } from 'react-icons/fa';
import roomService from '../services/roomService';
import RoomForm from '../components/rooms/RoomForm';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  // ✅ FIXED: Better error handling and logging
  const fetchRooms = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching rooms...');
      
      const response = await roomService.getRooms();
      console.log('📥 Response from server:', response);
      
      // Check if response has data
      if (response && response.success === true) {
        setRooms(response.data || []);
        console.log(`✅ Loaded ${response.data?.length || 0} rooms`);
      } else if (response && response.data) {
        setRooms(response.data);
        console.log(`✅ Loaded ${response.data.length} rooms`);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setRooms([]);
      }
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      
      // Show specific error message to user
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error';
        toast.error(`Server error (${status}): ${message}`);
      } else if (error.request) {
        // Request was made but no response
        toast.error('Cannot connect to server. Is backend running?');
      } else {
        toast.error(error.message || 'Failed to load rooms');
      }
      
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await roomService.deleteRoom(id);
      toast.success('Room deleted successfully');
      await fetchRooms(); // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting room:', error);
      toast.error(error.message || 'Failed to delete room');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-blue-100 text-blue-800',
      occupied: 'bg-yellow-100 text-yellow-800',
      dirty: 'bg-orange-100 text-orange-800',
      cleaning: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-red-100 text-red-800',
      out_of_service: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <button
          onClick={() => {
            setEditingRoom(null);
            setShowForm(true);
          }}
          className="mt-3 sm:mt-0 btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Room
        </button>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="card text-center py-8">
          <FaBed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No rooms found. Add your first room!</p>
          <button
            onClick={() => {
              setEditingRoom(null);
              setShowForm(true);
            }}
            className="mt-4 btn-primary"
          >
            <FaPlus className="inline mr-2" />
            Add Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="card hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">Room {room.room_number}</p>
                  <p className="text-sm text-gray-600">{room.room_type_name || 'Standard'}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status)}`}>
                  {room.status || 'Available'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>Floor: {room.floor || 1}</p>
                <p>Building: {room.building || 'Main'}</p>
                {room.price_override && (
                  <p className="text-primary-600 font-semibold">${room.price_override}/night</p>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => {
                    setEditingRoom(room);
                    setShowForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Form Modal */}
      {showForm && (
        <RoomForm
          room={editingRoom}
          onClose={() => {
            setShowForm(false);
            setEditingRoom(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setEditingRoom(null);
            await fetchRooms(); // Refresh after success
          }}
        />
      )}
    </div>
  );
};

export default RoomsPage;