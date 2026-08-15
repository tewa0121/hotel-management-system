import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaBars, FaBell, FaUserCircle, FaSearch, FaTimes } from 'react-icons/fa';
import notificationService from '../../services/notificationService';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    // ✅ Fetch notifications on load and every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            if (data.success) {
                setNotifications(data.data || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <nav className="bg-white border-b border-gray-200 fixed top-0 right-0 left-0 z-30 sm:ml-64 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
                {/* Left side - Hamburger + Search */}
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <FaBars className="h-5 w-5 text-gray-600" />
                    </button>
                    {/* ... search input ... */}
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-3">
                    {/* ✅ Notifications with real data */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                        >
                            <FaBell className="h-5 w-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <p className="font-semibold text-gray-900">Notifications</p>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllAsRead} 
                                            className="text-xs text-primary-600 hover:text-primary-700"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setShowNotifications(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes className="h-4 w-4" />
                                    </button>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No notifications
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
                                                !notif.is_read ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${
                                                    !notif.is_read ? 'bg-blue-500' : 'bg-gray-300'
                                                }`}></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-800">{notif.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(notif.created_at).toLocaleString()}
                                                    </p>
                                                    {notif.link && (
                                                        <a href={notif.link} className="text-xs text-primary-600 hover:underline">
                                                            View
                                                        </a>
                                                    )}
                                                </div>
                                                {!notif.is_read && (
                                                    <button 
                                                        onClick={() => markAsRead(notif.id)} 
                                                        className="text-xs text-gray-400 hover:text-gray-600"
                                                    >
                                                        ✓
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* User profile */}
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