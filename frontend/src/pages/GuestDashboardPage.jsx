import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    FaUser,
    FaSignOutAlt,
    FaCalendarCheck,
    FaFileInvoice,
    FaBed,
    FaMoneyBillWave,
    FaClock,
    FaEdit,
    FaTimes,
    FaUtensils,      // ✅ Food Orders icon
    FaShoppingCart   // ✅ Additional food icon
} from 'react-icons/fa';

const GuestDashboardPage = () => {
    const [guest, setGuest] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [foodOrders, setFoodOrders] = useState([]); // ✅ NEW
    const [loading, setLoading] = useState(true);
    const [foodLoading, setFoodLoading] = useState(false); // ✅ NEW
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
        country: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchGuestData();
        fetchFoodOrders(); // ✅ Fetch food orders
    }, []);

    const fetchGuestData = async () => {
        const token = localStorage.getItem('guestToken');
        if (!token) {
            navigate('/guest/login');
            return;
        }

        try {
            const [profileRes, reservationsRes, invoicesRes] = await Promise.all([
                fetch('http://localhost:5000/api/guest/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/guest/reservations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/guest/invoices', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const profileData = await profileRes.json();
            const reservationsData = await reservationsRes.json();
            const invoicesData = await invoicesRes.json();

            if (profileData.success) {
                setGuest(profileData.data);
                setEditForm({
                    first_name: profileData.data.first_name || '',
                    last_name: profileData.data.last_name || '',
                    phone: profileData.data.phone || '',
                    address: profileData.data.address || '',
                    city: profileData.data.city || '',
                    country: profileData.data.country || ''
                });
            }
            if (reservationsData.success) setReservations(reservationsData.data);
            if (invoicesData.success) setInvoices(invoicesData.data);
        } catch (error) {
            toast.error('Failed to load guest data');
        } finally {
            setLoading(false);
        }
    };

    // ✅ NEW: Fetch food orders
    const fetchFoodOrders = async () => {
        const token = localStorage.getItem('guestToken');
        if (!token) return;

        try {
            setFoodLoading(true);
            const response = await fetch('http://localhost:5000/api/guest/food-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setFoodOrders(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching food orders:', error);
        } finally {
            setFoodLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('guestToken');
        localStorage.removeItem('guest');
        navigate('/guest/login');
        toast.success('Logged out');
    };

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('guestToken');
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setEditLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/guest/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Profile updated successfully!');
                setGuest(data.data);
                setShowEditModal(false);
                const storedGuest = JSON.parse(localStorage.getItem('guest') || '{}');
                const updatedGuest = { ...storedGuest, ...data.data };
                localStorage.setItem('guest', JSON.stringify(updatedGuest));
            } else {
                toast.error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setEditLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            checked_in: 'bg-green-100 text-green-800',
            checked_out: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getFoodStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            preparing: 'bg-blue-100 text-blue-800',
            ready: 'bg-green-100 text-green-800',
            delivered: 'bg-purple-100 text-purple-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back, {guest?.first_name}! 👋
                        </h1>
                        <p className="text-gray-600">Here's a summary of your stays</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-3 sm:mt-0 btn-secondary flex items-center gap-2"
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="card text-center">
                        <p className="text-sm text-gray-600">Total Stays</p>
                        <p className="text-2xl font-bold text-gray-900">{guest?.total_stays || 0}</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-2xl font-bold text-primary-600">${guest?.total_spent || 0}</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-sm text-gray-600">Upcoming Stays</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {reservations.filter(r => r.reservation_status === 'confirmed' || r.reservation_status === 'checked_in').length}
                        </p>
                    </div>
                    <div className="card text-center">
                        <p className="text-sm text-gray-600">Food Orders</p>
                        <p className="text-2xl font-bold text-amber-600">{foodOrders.length}</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="card mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl">
                            {guest?.first_name?.[0]}{guest?.last_name?.[0]}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold">{guest?.first_name} {guest?.last_name}</h2>
                            <p className="text-gray-600">{guest?.email}</p>
                            <p className="text-gray-500 text-sm">{guest?.phone}</p>
                        </div>
                        <button 
                            onClick={handleEditClick}
                            className="btn-secondary text-sm flex items-center gap-2"
                        >
                            <FaEdit /> Edit Profile
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'dashboard'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FaCalendarCheck className="inline mr-2" />
                        Reservations
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'invoices'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FaFileInvoice className="inline mr-2" />
                        Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('food')}
                        className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'food'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FaUtensils className="inline mr-2" />
                        Food Orders
                    </button>
                </div>

                {/* Reservations Tab */}
                {activeTab === 'dashboard' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Your Reservations</h3>
                        {reservations.length === 0 ? (
                            <div className="card text-center py-8">
                                <FaCalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No reservations found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reservations.map((res) => (
                                    <div key={res.id} className="card hover:shadow-md transition">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900">
                                                        Room {res.room_number}
                                                    </p>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(res.reservation_status)}`}>
                                                        {res.reservation_status?.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        #{res.reservation_number}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    <FaCalendarCheck className="inline h-3 w-3 mr-1" />
                                                    {res.check_in_date} → {res.check_out_date}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {res.adults} adult(s), {res.children} child(ren)
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary-600">
                                                    ${res.total_amount}
                                                </p>
                                                {res.deposit_paid > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        Paid: ${res.deposit_paid}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Your Invoices</h3>
                        {invoices.length === 0 ? (
                            <div className="card text-center py-8">
                                <FaFileInvoice className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No invoices found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {invoices.map((inv) => (
                                    <div key={inv.id} className="card hover:shadow-md transition">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900">
                                                        {inv.invoice_number}
                                                    </p>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                        inv.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    <FaCalendarCheck className="inline h-3 w-3 mr-1" />
                                                    {new Date(inv.invoice_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Reservation: {inv.reservation_number}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary-600">
                                                    ${inv.total}
                                                </p>
                                                {inv.paid_amount > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        Paid: ${inv.paid_amount}
                                                    </p>
                                                )}
                                                {inv.balance > 0 && (
                                                    <p className="text-xs text-red-500">
                                                        Balance: ${inv.balance}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ✅ Food Orders Tab */}
                {activeTab === 'food' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Your Food Orders</h3>
                        {foodLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Loading food orders...</p>
                            </div>
                        ) : foodOrders.length === 0 ? (
                            <div className="card text-center py-8">
                                <FaUtensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No food orders found.</p>
                                <p className="text-sm text-gray-400">Order food from the hotel restaurant!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {foodOrders.map((order) => (
                                    <div key={order.id} className="card hover:shadow-md transition">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900">
                                                        Order #{order.id}
                                                    </p>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getFoodStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    <FaCalendarCheck className="inline h-3 w-3 mr-1" />
                                                    {new Date(order.order_date).toLocaleString()}
                                                </p>
                                                {order.item_names && (
                                                    <p className="text-sm text-gray-500">
                                                        <FaShoppingCart className="inline h-3 w-3 mr-1" />
                                                        {order.item_names}
                                                    </p>
                                                )}
                                                {order.notes && (
                                                    <p className="text-xs text-gray-400">Notes: {order.notes}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary-600">
                                                    ${order.total_amount}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {order.item_count || 0} items
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FaTimes className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={editForm.first_name}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={editForm.last_name}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={editForm.phone}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    placeholder="0912345678"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={editForm.address}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    placeholder="123 Main Street"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={editForm.city}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    placeholder="Addis Ababa"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={editForm.country}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    placeholder="Ethiopia"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="btn-primary"
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestDashboardPage;