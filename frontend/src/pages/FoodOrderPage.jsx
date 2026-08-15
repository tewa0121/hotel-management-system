import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaUser, FaBed } from 'react-icons/fa';
import foodService from '../services/foodService';
import guestService from '../services/guestService';
import reservationService from '../services/reservationService';
import { useAuth } from '../context/AuthContext';

const FoodOrderPage = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [guestSearch, setGuestSearch] = useState('');
    const [guestResults, setGuestResults] = useState([]);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [showGuestSearch, setShowGuestSearch] = useState(false);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { isAuthenticated, user: authUser } = useAuth();
    const isGuest = authUser?.role === 'guest';

    useEffect(() => {
        fetchData();
        if (isGuest && authUser) {
            setSelectedGuest({ id: authUser.id, first_name: authUser.firstName, last_name: authUser.lastName, email: authUser.email });
            fetchGuestReservations(authUser.id);
        }
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemRes, catRes] = await Promise.all([
                foodService.getItems(),
                foodService.getCategories()
            ]);
            if (itemRes.success) setItems(itemRes.data || []);
            if (catRes.success) setCategories(catRes.data || []);
        } catch (error) {
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const fetchGuestReservations = async (guestId) => {
        try {
            const res = await reservationService.getReservationsByGuest(guestId);
            if (res.success) setReservations(res.data || []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    };

    const searchGuests = async (query) => {
        if (query.length < 2) { setGuestResults([]); return; }
        try {
            const res = await guestService.getGuests(1, 10, query);
            if (res.success) setGuestResults(res.data || []);
        } catch (error) {
            console.error('Error searching guests:', error);
        }
    };

    const handleGuestSelect = (guest) => {
        setSelectedGuest(guest);
        setGuestSearch('');
        setGuestResults([]);
        setShowGuestSearch(false);
        fetchGuestReservations(guest.id);
    };

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(c => c.food_item_id === item.id);
            if (existing) {
                return prev.map(c => c.food_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            }
            return [...prev, { food_item_id: item.id, name: item.name, price: item.price, quantity: 1, unit_price: item.price }];
        });
        toast.success(`Added ${item.name} to cart`);
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(c => {
            if (c.food_item_id === id) {
                const newQty = c.quantity + delta;
                if (newQty <= 0) return null;
                return { ...c, quantity: newQty };
            }
            return c;
        }).filter(Boolean));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(c => c.food_item_id !== id));
    };

    const clearCart = () => setCart([]);

    const totalAmount = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const handleSubmitOrder = async () => {
        if (!selectedGuest) {
            toast.error('Please select a guest');
            return;
        }
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        const orderData = {
            guest_id: selectedGuest.id,
            reservation_id: selectedReservation?.id || null,
            room_id: selectedReservation?.room_id || null,
            notes: notes || null,
            items: cart.map(item => ({
                food_item_id: item.food_item_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            }))
        };

        setSubmitting(true);
        try {
            const res = await foodService.createOrder(orderData);
            if (res.success) {
                toast.success('Order placed successfully!');
                setCart([]);
                setNotes('');
                setSelectedReservation(null);
            } else {
                toast.error(res.message || 'Failed to place order');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = selectedCategory ? item.category_id === parseInt(selectedCategory) : true;
        return matchSearch && matchCategory && item.is_available;
    });

    if (loading) {
        return <div className="text-center py-12">Loading menu...</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Column */}
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Place Order</h1>
                </div>

                {/* Guest Selection */}
                {!isGuest && (
                    <div className="card mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FaUser className="text-gray-400" />
                            <span className="font-medium">Guest</span>
                            {selectedGuest && (
                                <span className="ml-auto text-sm text-primary-600">
                                    {selectedGuest.first_name} {selectedGuest.last_name}
                                    <button onClick={() => setSelectedGuest(null)} className="ml-2 text-red-500 hover:text-red-700">✕</button>
                                </span>
                            )}
                        </div>
                        {!selectedGuest && (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search guest by name or email..."
                                    value={guestSearch}
                                    onChange={(e) => { setGuestSearch(e.target.value); searchGuests(e.target.value); }}
                                    onFocus={() => setShowGuestSearch(true)}
                                    className="input-field"
                                />
                                {showGuestSearch && guestResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {guestResults.map(g => (
                                            <div key={g.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => handleGuestSelect(g)}>
                                                {g.first_name} {g.last_name} – {g.email}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {selectedGuest && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700">Reservation (optional)</label>
                                <select
                                    value={selectedReservation?.id || ''}
                                    onChange={(e) => {
                                        const res = reservations.find(r => r.id === parseInt(e.target.value));
                                        setSelectedReservation(res || null);
                                    }}
                                    className="input-field mt-1"
                                >
                                    <option value="">No reservation</option>
                                    {reservations.map(r => (
                                        <option key={r.id} value={r.id}>
                                            #{r.reservation_number} – {r.check_in_date} to {r.check_out_date}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Filters */}
                <div className="card mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10"
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                        </div>
                        <div className="sm:w-48">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="input-field"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredItems.map(item => (
                        <div key={item.id} className="card hover:shadow-lg transition flex flex-col">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                <p className="text-sm text-gray-500">{item.description || ''}</p>
                                <p className="text-sm text-gray-400 mt-1">{categories.find(c => c.id === item.category_id)?.name}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                <span className="font-bold text-primary-600">${item.price}</span>
                                <button
                                    onClick={() => addToCart(item)}
                                    className="btn-primary text-sm py-1 px-3 flex items-center gap-1"
                                >
                                    <FaPlus className="h-3 w-3" /> Add
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">No items available</div>
                    )}
                </div>
            </div>

            {/* Cart Column */}
            <div className="lg:col-span-1">
                <div className="card sticky top-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <FaShoppingCart /> Cart <span className="text-sm font-normal text-gray-500">({cart.length} items)</span>
                    </h2>
                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Cart is empty</p>
                    ) : (
                        <>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.food_item_id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-gray-500">${item.unit_price} × {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => updateQuantity(item.food_item_id, -1)} className="p-1 text-gray-500 hover:bg-gray-100 rounded">-</button>
                                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.food_item_id, 1)} className="p-1 text-gray-500 hover:bg-gray-100 rounded">+</button>
                                            <button onClick={() => removeFromCart(item.food_item_id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1">
                                                <FaTrash className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${totalAmount.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={clearCart}
                                    className="text-sm text-red-500 hover:text-red-700 mt-1"
                                    disabled={cart.length === 0}
                                >
                                    Clear Cart
                                </button>
                            </div>
                            <div className="mt-4">
                                <textarea
                                    placeholder="Order notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input-field text-sm"
                                    rows="2"
                                />
                            </div>
                            <button
                                onClick={handleSubmitOrder}
                                disabled={submitting || cart.length === 0 || !selectedGuest}
                                className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Placing...' : 'Place Order'}
                            </button>
                            {!selectedGuest && !isGuest && (
                                <p className="text-xs text-red-500 mt-1 text-center">Please select a guest</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodOrderPage;