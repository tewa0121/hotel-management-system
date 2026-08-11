import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBed } from 'react-icons/fa';
import roomService from '../services/roomService';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getRooms();
      setRooms(response.data || []);
    } catch (error) {
      toast.error('Failed to load rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
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
        <div className="text-center py-8">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="card text-center py-8">
          <FaBed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No rooms found. Add your first room!</p>
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
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this room?')) {
                      // Delete logic
                    }
                  }}
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
    </div>
  );
};

export default RoomsPage;