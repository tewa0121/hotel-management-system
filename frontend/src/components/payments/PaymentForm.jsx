import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes, FaCreditCard, FaMoneyBillWave, FaUniversity, FaMobileAlt, FaSync } from 'react-icons/fa';
import paymentService from '../../services/paymentService';
import reservationService from '../../services/reservationService';

const PaymentForm = ({ reservationId, guestId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [formData, setFormData] = useState({
    reservation_id: reservationId || '',
    guest_id: guestId || '',
    amount: '',
    currency: 'USD',
    payment_method: 'cash',
    reference_number: '',
    status: 'completed',
    notes: ''
  });

  useEffect(() => {
    fetchReservations();
    if (reservationId) {
      loadReservationDetails(reservationId);
    }
  }, [reservationId]);

  // ✅ Fetch reservations with loading state - INCLUDES PENDING
  const fetchReservations = async () => {
    setLoadingReservations(true);
    try {
      const response = await reservationService.getReservations(1, 100);
      
      // ✅ FIX: Include pending, confirmed, and checked_in
      const allReservations = (response.data || []).filter(r => 
        r.reservation_status === 'pending' || 
        r.reservation_status === 'confirmed' || 
        r.reservation_status === 'checked_in'
      );
      
      setReservations(allReservations);
      
      if (allReservations.length === 0) {
        toast.info('No reservations found. Please create a reservation first.');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoadingReservations(false);
      setLoadingData(false);
    }
  };

  // ✅ Refresh reservations (called by button)
  const refreshReservations = () => {
    toast.promise(fetchReservations(), {
      loading: 'Refreshing reservations...',
      success: 'Reservations refreshed!',
      error: 'Failed to refresh reservations'
    });
  };

  const loadReservationDetails = async (id) => {
    try {
      const response = await reservationService.getReservation(id);
      if (response.success) {
        const res = response.data;
        setSelectedReservation(res);
        setGuestName(`${res.first_name} ${res.last_name}`);
        setFormData(prev => ({
          ...prev,
          reservation_id: res.id,
          guest_id: res.guest_id,
          amount: res.balance?.toString() || res.total_amount?.toString() || ''
        }));
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
    }
  };

  const handleReservationChange = async (e) => {
    const id = e.target.value;
    
    if (!id) {
      setSelectedReservation(null);
      setGuestName('');
      setFormData(prev => ({ ...prev, reservation_id: '', guest_id: '', amount: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, reservation_id: id }));
    
    try {
      const response = await reservationService.getReservation(id);
      if (response.success) {
        const res = response.data;
        setSelectedReservation(res);
        setGuestName(`${res.first_name} ${res.last_name}`);
        setFormData(prev => ({
          ...prev,
          guest_id: res.guest_id,
          amount: res.balance?.toString() || res.total_amount?.toString() || ''
        }));
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
      toast.error('Failed to load reservation details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reservation_id) {
      toast.error('Please select a reservation');
      return;
    }

    if (!formData.guest_id) {
      toast.error('Guest information is missing. Please select a reservation first.');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        reservation_id: parseInt(formData.reservation_id),
        guest_id: parseInt(formData.guest_id)
      };

      console.log('📤 Submitting payment:', paymentData);
      
      await paymentService.createPayment(paymentData);
      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FaCreditCard className="text-primary-600" />
            Record Payment
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reservation Selection with Refresh Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reservation <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.reservation_id}
                onChange={handleReservationChange}
                className="input-field flex-1"
                required
              >
                <option value="">Select Reservation</option>
                {reservations.map((res) => (
                  <option key={res.id} value={res.id}>
                    #{res.reservation_number} - {res.first_name} {res.last_name} 
                    {res.balance > 0 ? ` - Balance: $${res.balance}` : ' - Paid'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={refreshReservations}
                disabled={loadingReservations}
                className="btn-secondary px-4 flex items-center gap-2 whitespace-nowrap"
                title="Refresh reservation list"
              >
                <FaSync className={`${loadingReservations ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            {reservations.length === 0 && (
              <div className="mt-1 text-xs text-yellow-600 flex items-center gap-2">
                <span>No reservations found.</span>
                <button
                  type="button"
                  onClick={refreshReservations}
                  className="text-primary-600 hover:underline font-medium"
                >
                  Refresh list
                </button>
              </div>
            )}
          </div>

          {/* Guest Name */}
          {guestName && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Guest</p>
              <p className="font-medium text-gray-900">{guestName}</p>
            </div>
          )}

          {/* Reservation Info */}
          {selectedReservation && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reservation</span>
                <span className="font-medium">#{selectedReservation.reservation_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room</span>
                <span className="font-medium">Room {selectedReservation.room_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check In</span>
                <span className="font-medium">{selectedReservation.check_in_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check Out</span>
                <span className="font-medium">{selectedReservation.check_out_date}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold text-gray-900">${selectedReservation.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance Due</span>
                <span className="font-bold text-primary-600">${selectedReservation.balance}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input-field pl-7"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            {selectedReservation && selectedReservation.balance > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Balance: ${selectedReservation.balance}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash', label: 'Cash', icon: FaMoneyBillWave },
                { value: 'credit_card', label: 'Credit Card', icon: FaCreditCard },
                { value: 'debit_card', label: 'Debit Card', icon: FaCreditCard },
                { value: 'bank_transfer', label: 'Bank Transfer', icon: FaUniversity },
                { value: 'mobile_money', label: 'Mobile Money', icon: FaMobileAlt },
                { value: 'other', label: 'Other', icon: FaCreditCard }
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value }))}
                  className={`p-3 border-2 rounded-lg flex items-center gap-2 transition-all ${
                    formData.payment_method === method.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <method.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              className="input-field"
              placeholder="Transaction reference / check number"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="input-field"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="ETB">ETB - Ethiopian Birr</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="input-field"
              placeholder="Additional notes about this payment..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;