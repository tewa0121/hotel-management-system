import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaUsers,
  FaBed,
  FaCalendarCheck,
  FaCreditCard,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaHotel,
  FaChartBar,
  FaBroom,
  FaTools
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/guests', icon: FaUsers, label: 'Guests' },
    { path: '/rooms', icon: FaBed, label: 'Rooms' },
    { path: '/reservations', icon: FaCalendarCheck, label: 'Reservations' },
    { path: '/payments', icon: FaCreditCard, label: 'Payments' },
    { path: '/housekeeping', icon: FaBroom, label: 'Housekeeping' },
    { path: '/maintenance', icon: FaTools, label: 'Maintenance' },
    { path: '/reports', icon: FaChartBar, label: 'Reports' },
  ];

  // Admin only items
  if (user?.role === 'admin' || user?.role === 'manager') {
    menuItems.push({ path: '/settings', icon: FaCog, label: 'Settings' });
  }

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-gray-900 text-white transition-transform -translate-x-full sm:translate-x-0">
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <FaHotel className="h-8 w-8 text-primary-400 mr-2" />
          <span className="text-xl font-bold">Hotel HMS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'Role'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="h-4 w-4 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;