
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    FaTimes,
    FaSearch,
    FaUser,
    FaMoneyBillWave,
} from 'react-icons/fa';

import reservationService from '../../services/reservationService';
import guestService from '../../services/guestService';
import roomService from '../../services/roomService';

const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    return error?.message || error?.error || 'Something went wrong';
};

const toDateInput = (value) => {
    if (!value) return '';
    return String(value).slice(0, 10);
};

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
        notes: '',
    });

    useEffect(() => {
        loadGuests();
        loadRoomTypes();

        if (reservation) {
            setFormData({
                guest_id: reservation.guest_id || '',
                room_id: reservation.room_id || '',
                check_in_date: toDateInput(reservation.check_in_date),
                check_out_date: toDateInput(reservation.check_out_date),
                adults: reservation.adults ?? 1,
                children: reservation.children ?? 0,
                rate: Number(reservation.rate) || 0,
                discount: Number(reservation.discount) || 0,
                tax: Number(reservation.tax) || 0,
                total_amount: Number(reservation.total_amount) || 0,
                deposit_paid: Number(reservation.deposit_paid) || 0,
                source: reservation.source || 'direct',
                special_requests: reservation.special_requests || '',
                notes: reservation.notes || '',
            });

            setSelectedGuest({
                id: reservation.guest_id,
                first_name: reservation.first_name || '',
                last_name: reservation.last_name || '',
            });

            setGuestSearch(
                `${reservation.first_name || ''} ${reservation.last_name || ''}`.trim()
            );

            // Keep the current room visible while editing.
            if (reservation.room_id) {
                setAvailableRooms([{
                    id: Number(reservation.room_id),
                    room_number: reservation.room_number || 'Current room',
                    room_type_name: reservation.room_type_name || '',
                    base_price: Number(reservation.rate) || 0,
                    price_override: null,
                    max_occupancy: reservation.max_occupancy || 10,
                    status: 'currently assigned',
                }]);
            }

            setPriceCalculated(true);
        }
    }, [reservation]);

    const loadGuests = async () => {
        try {
            const response = await guestService.getGuests(1, 100);
            setGuests(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Could not load guests:', error);
            toast.error('Could not load guests');
        }
    };

    const loadRoomTypes = async () => {
        try {
            const response = await roomService.getRoomTypes();
            setRoomTypes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Could not load room types:', error);
        }
    };

    const handleGuestSearch = (event) => {
        const value = event.target.value;

        setGuestSearch(value);
        setShowGuestSearch(true);

        if (
            selectedGuest &&
            value !== `${selectedGuest.first_name} ${selectedGuest.last_name}`
        ) {
            setSelectedGuest(null);
            setFormData((previous) => ({ ...previous, guest_id: '' }));
        }
    };

    const selectGuest = (guest) => {
        setSelectedGuest(guest);
        setFormData((previous) => ({
            ...previous,
            guest_id: guest.id,
        }));
        setGuestSearch(`${guest.first_name} ${guest.last_name}`);
        setShowGuestSearch(false);
        setErrors((previous) => ({ ...previous, guest_id: '' }));
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({ ...previous, [name]: '' }));

        if (['check_in_date', 'check_out_date', 'adults', 'children'].includes(name)) {
            setAvailableRooms([]);
            setPriceCalculated(false);
            setFormData((previous) => ({
                ...previous,
                [name]: value,
                room_id: '',
            }));
        }
    };

    const checkAvailability = async () => {
        if (!formData.check_in_date || !formData.check_out_date) {
            toast.error('Please select check-in and check-out dates');
            return;
        }

        if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
            toast.error('Check-out must be after check-in');
            return;
        }

        setCheckingAvailability(true);

        try {
            const response = await reservationService.getAvailableRooms(
                formData.check_in_date,
                formData.check_out_date,
                null,
                Number(formData.adults) + Number(formData.children)
            );

            const rooms = Array.isArray(response.data) ? response.data : [];

            // Include the current room in edit mode if it wasn't returned.
            if (reservation?.room_id) {
                const currentRoom = {
                    id: Number(reservation.room_id),
                    room_number: reservation.room_number || 'Current room',
                    room_type_name: reservation.room_type_name || '',
                    base_price: Number(reservation.rate) || 0,
                    status: 'currently assigned',
                };

                if (!rooms.some((room) => Number(room.id) === Number(reservation.room_id))) {
                    rooms.unshift(currentRoom);
                }
            }

            setAvailableRooms(rooms);
            setFormData((previous) => ({ ...previous, room_id: '' }));
            setPriceCalculated(false);

            if (rooms.length === 0) {
                toast.error('No rooms available for selected dates');
            } else {
                toast.success(`${rooms.length} room(s) available`);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
            console.error('Availability error:', error);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const calculatePrice = () => {
        if (!formData.room_id) {
            toast.error('Please select a room first');
            return;
        }

        const selectedRoom = availableRooms.find(
            (room) => Number(room.id) === Number(formData.room_id)
        );

        if (!selectedRoom) {
            toast.error('Selected room not found');
            return;
        }

        const checkIn = new Date(`${formData.check_in_date}T00:00:00`);
        const checkOut = new Date(`${formData.check_out_date}T00:00:00`);
        const nights = Math.round((checkOut - checkIn) / 86400000);

        if (nights <= 0) {
            toast.error('Check-out must be after check-in');
            return;
        }

        const nightlyRate = Number(
            selectedRoom.price_override ?? selectedRoom.base_price ?? 0
        );

        const subtotal = nightlyRate * nights;
        const discount = Number(formData.discount) || 0;

        // Keep this tax rate consistent with your backend reservationRules.js.
        const tax = Math.max(0, subtotal - discount) * 0.12;
        const total = Math.max(0, subtotal - discount + tax);

        setFormData((previous) => ({
            ...previous,
            rate: nightlyRate,
            tax,
            total_amount: total,
        }));

        setPriceCalculated(true);
        toast.success(`Total: ${total.toFixed(2)} for ${nights} night(s)`);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.guest_id) newErrors.guest_id = 'Please select a guest';
        if (!formData.room_id) newErrors.room_id = 'Please select a room';
        if (!formData.check_in_date) newErrors.check_in_date = 'Check-in date is required';
        if (!formData.check_out_date) newErrors.check_out_date = 'Check-out date is required';

        if (
            formData.check_in_date &&
            formData.check_out_date &&
            new Date(formData.check_out_date) <= new Date(formData.check_in_date)
        ) {
            newErrors.check_out_date = 'Check-out must be after check-in';
        }

        if (Number(formData.adults) < 1) {
            newErrors.adults = 'At least one adult is required';
        }

        if (Number(formData.children) < 0) {
            newErrors.children = 'Children cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields correctly');
            return;
        }

        setLoading(true);

        try {
            const data = {
                ...formData,
                guest_id: Number(formData.guest_id),
                room_id: Number(formData.room_id),
                adults: Number(formData.adults) || 1,
                children: Number(formData.children) || 0,
                rate: Number(formData.rate) || 0,
                discount: Number(formData.discount) || 0,
                tax: Number(formData.tax) || 0,
                total_amount: Number(formData.total_amount) || 0,
                deposit_paid: Number(formData.deposit_paid) || 0,
            };

            if (reservation) {
                await reservationService.updateReservation(reservation.id, data);
                toast.success('Reservation updated successfully');
            } else {
                await reservationService.createReservation(data);
                toast.success('Reservation created successfully');
            }

            onSuccess?.();
        } catch (error) {
            console.error('Reservation save error:', error);
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const filteredGuests = guests.filter((guest) => {
        const search = guestSearch.toLowerCase();

        return (
            `${guest.first_name} ${guest.last_name}`.toLowerCase().includes(search) ||
            guest.email?.toLowerCase().includes(search) ||
            guest.phone?.includes(guestSearch)
        );
    });

    const formatCurrency = (value) => (Number(value) || 0).toFixed(2);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {reservation ? 'Edit Reservation' : 'New Reservation'}
                    </h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
                        <FaTimes className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    {/* Guest selection */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Guest <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <FaUser className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                value={guestSearch}
                                onChange={handleGuestSearch}
                                onFocus={() => setShowGuestSearch(true)}
                                placeholder="Search guest by name, email, or phone"
                                className="input-field pl-10"
                            />

                            {showGuestSearch && guestSearch.length > 0 && (
                                <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                                    {filteredGuests.length === 0 ? (
                                        <p className="p-3 text-sm text-gray-500">No guests found</p>
                                    ) : (
                                        filteredGuests.map((guest) => (
                                            <button
                                                type="button"
                                                key={guest.id}
                                                onClick={() => selectGuest(guest)}
                                                className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50"
                                            >
                                                <span>
                                                    <span className="block font-medium">
                                                        {guest.first_name} {guest.last_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {guest.email || guest.phone}
                                                    </span>
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedGuest && (
                            <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 p-3">
                                <span className="text-sm font-medium">
                                    {selectedGuest.first_name} {selectedGuest.last_name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedGuest(null);
                                        setGuestSearch('');
                                        setFormData((previous) => ({ ...previous, guest_id: '' }));
                                    }}
                                    className="text-sm text-red-600"
                                >
                                    Change
                                </button>
                            </div>
                        )}

                        {errors.guest_id && <p className="mt-1 text-xs text-red-500">{errors.guest_id}</p>}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Check-in date *</label>
                            <input
                                type="date"
                                name="check_in_date"
                                value={formData.check_in_date}
                                onChange={handleChange}
                                className="input-field"
                            />
                            {errors.check_in_date && <p className="text-xs text-red-500">{errors.check_in_date}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Check-out date *</label>
                            <input
                                type="date"
                                name="check_out_date"
                                value={formData.check_out_date}
                                onChange={handleChange}
                                className="input-field"
                            />
                            {errors.check_out_date && <p className="text-xs text-red-500">{errors.check_out_date}</p>}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={checkAvailability}
                        disabled={checkingAvailability}
                        className="btn-secondary flex w-full items-center justify-center gap-2"
                    >
                        <FaSearch />
                        {checkingAvailability ? 'Checking availability...' : 'Check Availability'}
                    </button>

                    {/* Rooms */}
                    {availableRooms.length > 0 && (
                        <div>
                            <label className="mb-2 block text-sm font-medium">Select room *</label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {availableRooms.map((room) => (
                                    <button
                                        type="button"
                                        key={room.id}
                                        onClick={() => {
                                            setFormData((previous) => ({
                                                ...previous,
                                                room_id: room.id,
                                            }));
                                            setPriceCalculated(false);
                                            setErrors((previous) => ({ ...previous, room_id: '' }));
                                        }}
                                        className={`rounded-lg border-2 p-3 text-left ${
                                            Number(formData.room_id) === Number(room.id)
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        <span className="block font-semibold">
                                            Room {room.room_number || room.id}
                                        </span>
                                        <span className="block text-sm text-gray-600">
                                            {room.room_type_name || 'Room'}
                                        </span>
                                        <span className="mt-1 block text-sm font-bold text-primary-600">
                                            ${formatCurrency(room.price_override ?? room.base_price)}/night
                                        </span>
                                        {room.status === 'currently assigned' && (
                                            <span className="text-xs text-amber-700">Currently assigned</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {errors.room_id && <p className="mt-1 text-xs text-red-500">{errors.room_id}</p>}
                        </div>
                    )}

                    {/* Occupancy and source */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Adults</label>
                            <input
                                type="number"
                                name="adults"
                                min="1"
                                max="10"
                                value={formData.adults}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Children</label>
                            <input
                                type="number"
                                name="children"
                                min="0"
                                max="10"
                                value={formData.children}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Source</label>
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

                    {/* Pricing */}
                    {formData.room_id && (
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={calculatePrice}
                                className="btn-primary flex w-full items-center justify-center gap-2"
                            >
                                <FaMoneyBillWave />
                                Calculate Price
                            </button>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Discount</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        min="0"
                                        step="0.01"
                                        value={formData.discount}
                                        onChange={(event) => {
                                            handleChange(event);
                                            setPriceCalculated(false);
                                        }}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium">Deposit paid</label>
                                    <input
                                        type="number"
                                        name="deposit_paid"
                                        min="0"
                                        step="0.01"
                                        value={formData.deposit_paid}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {priceCalculated && (
                                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Rate per night</span>
                                        <span>${formatCurrency(formData.rate)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Discount</span>
                                        <span>${formatCurrency(formData.discount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Tax</span>
                                        <span>${formatCurrency(formData.tax)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                        <span>Total</span>
                                        <span>${formatCurrency(formData.total_amount)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-medium">Special requests</label>
                        <textarea
                            name="special_requests"
                            rows="2"
                            value={formData.special_requests}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Notes</label>
                        <textarea
                            name="notes"
                            rows="2"
                            value={formData.notes}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-5">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading
                                ? 'Saving...'
                                : reservation
                                    ? 'Update Reservation'
                                    : 'Create Reservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationForm;
