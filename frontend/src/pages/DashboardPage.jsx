import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaBed,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaChartLine,
  FaDoorOpen,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';
import roomService from '../services/roomService';
import reservationService from '../services/reservationService';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    reservedRooms: 0,
    dirtyRooms: 0,
    maintenanceRooms: 0,
    todayArrivals: 0,
    todayDepartures: 0,
    totalGuests: 0,
    revenue: 0
  });
  const [recentReservations, setRecentReservations] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get room status
      const roomStatus = await roomService.getStatusBoard();
      const rooms = roomStatus.data || [];
      
      // Calculate stats
      const summary = roomStatus.summary || {};
      const totalRooms = rooms.length;
      const availableRooms = summary.available || 0;
      const occupiedRooms = summary.occupied || 0;
      const reservedRooms = summary.reserved || 0;
      const dirtyRooms = summary.dirty || 0;
      const maintenanceRooms = summary.maintenance || 0;

      // Get recent reservations
      const reservations = await reservationService.getReservations(1, 5);
      
      setStats({
        totalRooms,
        availableRooms,
        occupiedRooms,
        reservedRooms,
        dirtyRooms,
        maintenanceRooms,
        todayArrivals: 5,
        todayDepartures: 3,
        totalGuests: 24,
        revenue: 12500
      });
      
      setRecentReservations(reservations.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="card hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your hotel today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FaBed}
          title="Total Rooms"
          value={stats.totalRooms}
          color="bg-primary-500"
          subtitle={`${stats.availableRooms} available`}
        />
        <StatCard
          icon={FaDoorOpen}
          title="Occupied"
          value={stats.occupiedRooms}
          color="bg-green-500"
          subtitle={`${stats.reservedRooms} reserved`}
        />
        <StatCard
          icon={FaUsers}
          title="Current Guests"
          value={stats.totalGuests}
          color="bg-blue-500"
          subtitle="24 in-house"
        />
        <StatCard
          icon={FaMoneyBillWave}
          title="Today's Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          color="bg-yellow-500"
          subtitle="+15% from yesterday"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={FaCalendarCheck}
          title="Arrivals Today"
          value={stats.todayArrivals}
          color="bg-indigo-500"
        />
        <StatCard
          icon={FaClock}
          title="Departures Today"
          value={stats.todayDepartures}
          color="bg-purple-500"
        />
        <StatCard
          icon={FaExclamationTriangle}
          title="Maintenance"
          value={stats.maintenanceRooms}
          color="bg-red-500"
          subtitle={`${stats.dirtyRooms} rooms need cleaning`}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reservations</h3>
          <div className="space-y-3">
            {recentReservations.length > 0 ? (
              recentReservations.map((reservation, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {reservation.first_name} {reservation.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Room {reservation.room_number} • {reservation.check_in_date}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    reservation.reservation_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    reservation.reservation_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {reservation.reservation_status || 'Pending'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent reservations</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-primary-700 font-medium transition-colors">
              New Reservation
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition-colors">
              Check In
            </button>
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors">
              Add Guest
            </button>
            <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-700 font-medium transition-colors">
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;