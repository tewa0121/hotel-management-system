import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import foodService from '../services/foodService';

const FoodOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const statusOptions = [
        { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'preparing', label: 'Preparing', color: 'bg-blue-100 text-blue-800' },
        { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800' },
        { value: 'delivered', label: 'Delivered', color: 'bg-purple-100 text-purple-800' },
        { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    ];

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const filters = { status: filterStatus || undefined };
            const res = await foodService.getOrders(filters);
            if (res.success) setOrders(res.data || []);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (id) => {
        try {
            const res = await foodService.getOrder(id);
            if (res.success) {
                setSelectedOrder(res.data);
                setShowDetailModal(true);
            }
        } catch (error) {
            toast.error('Failed to load order details');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await foodService.updateOrder(id, { status });
            if (res.success) {
                toast.success('Order status updated');
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleCancelOrder = async (id) => {
        if (!window.confirm('Cancel this order?')) return;
        try {
            const res = await foodService.deleteOrder(id);
            if (res.success) {
                toast.success('Order cancelled');
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to cancel order');
        }
    };

    const getStatusBadge = (status) => {
        const option = statusOptions.find(s => s.value === status);
        return option ? <span className={`px-2 py-1 text-xs font-medium rounded-full ${option.color}`}>{option.label}</span> : status;
    };

    const filteredOrders = orders.filter(order => {
        const matchSearch = order.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.reservation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.id?.toString().includes(searchTerm);
        return matchSearch;
    });

    if (loading) {
        return <div className="text-center py-12">Loading orders...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Food Orders</h1>
                <button onClick={fetchOrders} className="btn-secondary">Refresh</button>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by guest name or order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input-field"
                        >
                            <option value="">All Status</option>
                            {statusOptions.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order #</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Guest</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Room</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="py-3 px-4 font-medium">#{order.id}</td>
                                <td className="py-3 px-4">{order.guest_name}</td>
                                <td className="py-3 px-4">{order.room_number || '-'}</td>
                                <td className="py-3 px-4 text-right font-bold text-primary-600">${order.total_amount}</td>
                                <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                                <td className="py-3 px-4 text-sm text-gray-500">{new Date(order.order_date).toLocaleDateString()}</td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleViewOrder(order.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View">
                                            <FaEye />
                                        </button>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                        >
                                            {statusOptions.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                            <button onClick={() => handleCancelOrder(order.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel">
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                            <tr><td colSpan="7" className="text-center py-8 text-gray-500">No orders found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-lg font-bold">Order #{selectedOrder.id}</h2>
                            <button onClick={() => { setShowDetailModal(false); setSelectedOrder(null); }} className="text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-gray-500">Guest:</span> {selectedOrder.guest_name}</div>
                                <div><span className="text-gray-500">Room:</span> {selectedOrder.room_number || '-'}</div>
                                <div><span className="text-gray-500">Status:</span> {getStatusBadge(selectedOrder.status)}</div>
                                <div><span className="text-gray-500">Date:</span> {new Date(selectedOrder.order_date).toLocaleString()}</div>
                                <div className="col-span-2"><span className="text-gray-500">Notes:</span> {selectedOrder.notes || '-'}</div>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-semibold mb-2">Items</h3>
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                                                <span>{item.item_name} × {item.quantity}</span>
                                                <span>${item.subtotal}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-bold text-primary-600 pt-2">
                                            <span>Total</span>
                                            <span>${selectedOrder.total_amount}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No items</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodOrdersPage;