import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaBars, FaBell, FaUserCircle, FaSearch, FaTimes } from 'react-icons/fa';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const notifications = [
    { id: 1, message: 'New reservation from John Smith', time: '2 min ago', type: 'reservation' },
    { id: 2, message: 'Room 205 needs cleaning', time: '15 min ago', type: 'housekeeping' },
    { id: 3, message: 'Payment received for room 302', time: '1 hour ago', type: 'payment' },
    { id: 4, message: 'Maintenance request for room 108', time: '2 hours ago', type: 'maintenance' },
  ];

  const getNotificationColor = (type) => {
    const colors = {
      reservation: 'bg-blue-500',
      housekeeping: 'bg-yellow-500',
      payment: 'bg-green-500',
      maintenance: 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 right-0 left-0 z-30 sm:ml-64 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaBars className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Desktop Search */}
          <div className="hidden md:flex items-center ml-4 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search guests, rooms, reservations..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80 text-sm"
            />
          </div>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaSearch className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="absolute top-full left-0 right-0 bg-white p-3 border-b border-gray-200 shadow-lg md:hidden">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <FaBell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <p className="font-semibold text-gray-900">Notifications</p>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                        <div className="flex items-start">
                          <div className={`w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${getNotificationColor(notif.type)}`}></div>
                          <div>
                            <p className="text-sm text-gray-800">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-200">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium w-full text-center">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center space-x-3 border-l border-gray-200 pl-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;