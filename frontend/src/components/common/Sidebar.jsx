import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaHome,
  FaUsers,
  FaBed,
  FaCalendarCheck,
  FaCreditCard,
  FaChartBar,
  FaBroom,
  FaTools,
  FaCog,
  FaSignOutAlt,
  FaHotel,
  FaUserCircle,
  FaFileInvoice  // Added this import
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/guests', icon: FaUsers, label: 'Guests' },
    { path: '/rooms', icon: FaBed, label: 'Rooms' },
    { path: '/reservations', icon: FaCalendarCheck, label: 'Reservations' },
    { path: '/payments', icon: FaCreditCard, label: 'Payments' },
    { path: '/invoices', icon: FaFileInvoice, label: 'Invoices' },  // Added this line
    { path: '/housekeeping', icon: FaBroom, label: 'Housekeeping' },
    { path: '/maintenance', icon: FaTools, label: 'Maintenance' },
    { path: '/reports', icon: FaChartBar, label: 'Reports' },
  ];

  // Admin/Manager only items
  if (user?.role === 'admin' || user?.role === 'manager') {
    menuItems.push({ path: '/settings', icon: FaCog, label: 'Settings' });
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Get user initials
  const getInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-transform -translate-x-full sm:translate-x-0 shadow-2xl">
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-gray-700/50">
          <div className="flex items-center">
            <div className="bg-primary-600 p-2 rounded-xl">
              <FaHotel className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold text-white">Hotel HMS</span>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.path === '/' && (
                    <span className="ml-auto bg-primary-400/20 text-primary-300 text-xs px-2 py-0.5 rounded-full">
                      Home
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-700/50 p-4">
          <div className="flex items-center mb-3 bg-gray-800/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {getInitials()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-400 capitalize truncate">
                {user?.role || 'Role'}
              </p>
            </div>
            <FaUserCircle className="h-5 w-5 text-gray-500" />
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors group"
          >
            <FaSignOutAlt className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;