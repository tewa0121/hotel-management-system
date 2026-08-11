import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaCalendarCheck, FaUser, FaBed } from 'react-icons/fa';
import reservationService from '../services/reservationService';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationService.getReservations();
      setReservations(response.data || []);
    } catch (error) {
      toast.error('Failed to load reservations');
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 sm:mt-0 btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          New Reservation
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading reservations...</div>
      ) : reservations.length === 0 ? (
        <div className="card text-center py-8">
          <FaCalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No reservations found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Guest</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Room</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check In</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check Out</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => (
                <tr key={res.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <FaUser className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {res.first_name} {res.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <FaBed className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Room {res.room_number}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{res.check_in_date}</td>
                  <td className="py-3 px-4 text-gray-600">{res.check_out_date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(res.reservation_status)}`}>
                      {res.reservation_status || 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    ${res.total_amount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;