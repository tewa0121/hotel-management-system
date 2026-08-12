import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes, FaSearch, FaUser, FaBed, FaCalendar, FaMoneyBillWave } from 'react-icons/fa';
import reservationService from '../../services/reservationService';
import guestService from '../../services/guestService';
import roomService from '../../services/roomService';

const ReservationForm = ({ reservation, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [guestSearch, setGuestSearch] = useState('');
    const [showGuestSearch, setShowGuestSearch] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [priceCalculated, setPriceCalculated] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        guest_id: '',
        room_id: '',
        check_in_date: '',
        check_out_date: '',
        adults: 1,
        children: 0,
        rate: 0,
        discount: 0,
        tax: 0,
        total_amount: 0,
        deposit_paid: 0,
        source: 'direct',
        special_requests: '',
        notes: ''
    });

    useEffect(() => {
        fetchGuests();
        fetchRoomTypes();
        if (reservation) {
            setFormData({
                guest_id: reservation.guest_id || '',
                room_id: reservation.room_id || '',
                check_in_date: reservation.check_in_date || '',
                check_out_date: reservation.check_out_date || '',
                adults: reservation.adults || 1,
                children: reservation.children || 0,
                rate: reservation.rate || 0,
                discount: reservation.discount || 0,
                tax: reservation.tax || 0,
                total_amount: reservation.total_amount || 0,
                deposit_paid: reservation.deposit_paid || 0,
                source: reservation.source || 'direct',
                special_requests: reservation.special_requests || '',
                notes: reservation.notes || ''
            });
            setSelectedGuest({ 
                id: reservation.guest_id, 
                first_name: reservation.first_name, 
                last_name: reservation.last_name 
            });
            setGuestSearch(`${reservation.first_name} ${reservation.last_name}`);
        }
    }, [reservation]);

    const fetchGuests = async () => {
        try {
            const response = await guestService.getGuests(1, 50);
            setGuests(response.data || []);
        } catch (error) {
            console.error('Error fetching guests:', error);
        }
    };

    const fetchRoomTypes = async () => {
        try {
            const response = await roomService.getRoomTypes();
            setRoomTypes(response.data || []);
        } catch (error) {
            console.error('Error fetching room types:', error);
        }
    };

    const handleGuestSearch = (e) => {
        const search = e.target.value;
        setGuestSearch(search);
        setShowGuestSearch(true);
    };

    const selectGuest = (guest) => {
        setSelectedGuest(guest);
        setFormData(prev => ({ ...prev, guest_id: guest.id }));
        setGuestSearch(`${guest.first_name} ${guest.last_name}`);
        setShowGuestSearch(false);
        setErrors(prev => ({ ...prev, guest_id: '' }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const checkAvailability = async () => {
        if (!formData.check_in_date) {
            toast.error('Please select check-in date');
            return;
        }
        if (!formData.check_out_date) {
            toast.error('Please select check-out date');
            return;
        }

        setCheckingAvailability(true);
        try {
            const response = await reservationService.getAvailableRooms(
                formData.check_in_date,
                formData.check_out_date,
                null,
                formData.adults
            );
            setAvailableRooms(response.data || []);
            setPriceCalculated(false);
            setFormData(prev => ({ ...prev, room_id: '' }));
            
            if (response.data.length === 0) {
                toast.error('No rooms available for selected dates');
            } else {
                toast.success(`${response.data.length} rooms available`);
            }
        } catch (error) {
            toast.error('Failed to check availability');
            console.error(error);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const calculatePrice = () => {
        if (!formData.room_id) {
            toast.error('Please select a room first');
            return;
        }

        const selectedRoom = availableRooms.find(r => r.id === parseInt(formData.room_id));
        if (!selectedRoom) {
            toast.error('Selected room not found');
            return;
        }

        const checkIn = new Date(formData.check_in_date);
        const checkOut = new Date(formData.check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
            toast.error('Check-out date must be after check-in date');
            return;
        }

        const basePrice = selectedRoom.price_override || selectedRoom.base_price || 0;
        const subtotal = basePrice * nights;
        const tax = subtotal * 0.12;
        const total = subtotal + tax;

        setFormData(prev => ({
            ...prev,
            rate: Number(basePrice),
            tax: Number(tax),
            total_amount: Number(total)
        }));
        setPriceCalculated(true);
        toast.success(`Total: $${total.toFixed(2)} for ${nights} nights`);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.guest_id) {
            newErrors.guest_id = 'Please select a guest';
        }

        if (!formData.room_id) {
            newErrors.room_id = 'Please select a room';
        }

        if (!formData.check_in_date) {
            newErrors.check_in_date = 'Check-in date is required';
        }

        if (!formData.check_out_date) {
            newErrors.check_out_date = 'Check-out date is required';
        }

        if (formData.check_in_date && formData.check_out_date) {
            const checkIn = new Date(formData.check_in_date);
            const checkOut = new Date(formData.check_out_date);
            if (checkOut <= checkIn) {
                newErrors.check_out_date = 'Check-out must be after check-in';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            const firstError = Object.values(errors)[0];
            toast.error(firstError || 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const data = {
                ...formData,
                rate: parseFloat(formData.rate) || 0,
                discount: parseFloat(formData.discount) || 0,
                tax: parseFloat(formData.tax) || 0,
                total_amount: parseFloat(formData.total_amount) || 0,
                deposit_paid: parseFloat(formData.deposit_paid) || 0,
                adults: parseInt(formData.adults) || 1,
                children: parseInt(formData.children) || 0
            };

            console.log('📤 Submitting reservation:', data);

            if (reservation) {
                await reservationService.updateReservation(reservation.id, data);
                toast.success('Reservation updated successfully');
            } else {
                await reservationService.createReservation(data);
                toast.success('Reservation created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('❌ Reservation error:', error);
            toast.error(error.message || 'Failed to save reservation');
        } finally {
            setLoading(false);
        }
    };

    // Filter guests for search
    const filteredGuests = guests.filter(g => 
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(guestSearch.toLowerCase()) ||
        g.email?.toLowerCase().includes(guestSearch.toLowerCase()) ||
        g.phone?.includes(guestSearch)
    );

    // Helper function to safely format currency
    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return num.toFixed(2);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        {reservation ? 'Edit Reservation' : 'New Reservation'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <FaTimes className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Guest Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guest <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search guest by name, email, or phone..."
                                        value={guestSearch}
                                        onChange={handleGuestSearch}
                                        onFocus={() => setShowGuestSearch(true)}
                                        className={`input-field pl-10 ${errors.guest_id ? 'border-red-500' : ''}`}
                                    />
                                </div>
                            </div>
                            
                            {showGuestSearch && guestSearch.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                                    {filteredGuests.length === 0 ? (
                                        <div className="px-4 py-2 text-gray-500 text-sm">No guests found</div>
                                    ) : (
                                        filteredGuests.map((guest) => (
                                            <div
                                                key={guest.id}
                                                onClick={() => selectGuest(guest)}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {guest.first_name} {guest.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{guest.email || guest.phone}</p>
                                                </div>
                                                <span className="text-xs text-gray-400">{guest.total_stays || 0} stays</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {selectedGuest && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        <FaUser className="inline mr-2 h-4 w-4 text-primary-600" />
                                        {selectedGuest.first_name} {selectedGuest.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">Selected guest</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedGuest(null);
                                        setGuestSearch('');
                                        setFormData(prev => ({ ...prev, guest_id: '' }));
                                    }}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Change
                                </button>
                            </div>
                        )}
                        {errors.guest_id && (
                            <p className="text-red-500 text-xs mt-1">{errors.guest_id}</p>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Check-in Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="check_in_date"
                                value={formData.check_in_date}
                                onChange={handleChange}
                                className={`input-field ${errors.check_in_date ? 'border-red-500' : ''}`}
                            />
                            {errors.check_in_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.check_in_date}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Check-out Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="check_out_date"
                                value={formData.check_out_date}
                                onChange={handleChange}
                                className={`input-field ${errors.check_out_date ? 'border-red-500' : ''}`}
                            />
                            {errors.check_out_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.check_out_date}</p>
                            )}
                        </div>
                    </div>

                    {/* Check Availability Button */}
                    <div>
                        <button
                            type="button"
                            onClick={checkAvailability}
                            disabled={checkingAvailability}
                            className="btn-secondary w-full flex items-center justify-center gap-2"
                        >
                            <FaSearch />
                            {checkingAvailability ? 'Checking...' : 'Check Availability'}
                        </button>
                    </div>

                    {/* Room Selection */}
                    {availableRooms.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Room <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, room_id: room.id }));
                                            setPriceCalculated(false);
                                            setErrors(prev => ({ ...prev, room_id: '' }));
                                        }}
                                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            parseInt(formData.room_id) === room.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">Room {room.room_number}</p>
                                                <p className="text-sm text-gray-600">{room.room_type_name}</p>
                                                <p className="text-xs text-gray-500">Max: {room.max_occupancy} guests</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary-600">
                                                    ${room.price_override || room.base_price}/night
                                                </p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    room.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {room.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.room_id && (
                                <p className="text-red-500 text-xs mt-1">{errors.room_id}</p>
                            )}
                        </div>
                    )}

                    {availableRooms.length === 0 && formData.check_in_date && formData.check_out_date && (
                        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-yellow-800">⚠️ No rooms available for selected dates</p>
                        </div>
                    )}

                    {/* Guests & Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                            <input
                                type="number"
                                name="adults"
                                value={formData.adults}
                                onChange={handleChange}
                                className="input-field"
                                min="1"
                                max="10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                            <input
                                type="number"
                                name="children"
                                value={formData.children}
                                onChange={handleChange}
                                className="input-field"
                                min="0"
                                max="10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="direct">Direct</option>
                                <option value="website">Website</option>
                                <option value="phone">Phone</option>
                                <option value="walk_in">Walk-in</option>
                                <option value="travel_agent">Travel Agent</option>
                                <option value="booking_platform">Booking Platform</option>
                                <option value="corporate">Corporate</option>
                            </select>
                        </div>
                    </div>

                    {/* Price Calculation */}
                    {formData.room_id && formData.check_in_date && formData.check_out_date && (
                        <div>
                            <button
                                type="button"
                                onClick={calculatePrice}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <FaMoneyBillWave />
                                Calculate Price
                            </button>
                        </div>
                    )}

                    {/* ✅ FIXED: Price Display with Number conversion */}
                    {priceCalculated && (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Rate per night</span>
                                <span className="font-medium">${formatCurrency(formData.rate)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax (12%)</span>
                                <span className="font-medium">${formatCurrency(formData.tax)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                                <span>Total</span>
                                <span className="text-primary-600">${formatCurrency(formData.total_amount)}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Paid</label>
                                <input
                                    type="number"
                                    name="deposit_paid"
                                    value={formData.deposit_paid}
                                    onChange={handleChange}
                                    className="input-field"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    )}

                    {/* Special Requests */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                        <textarea
                            name="special_requests"
                            value={formData.special_requests}
                            onChange={handleChange}
                            rows="2"
                            className="input-field"
                            placeholder="Any special requests for this reservation..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            className="input-field"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : (reservation ? 'Update Reservation' : 'Create Reservation')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationForm;