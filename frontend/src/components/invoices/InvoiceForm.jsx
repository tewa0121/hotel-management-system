import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes, FaFileInvoice, FaMoneyBillWave, FaCalendar } from 'react-icons/fa';
import invoiceService from '../../services/invoiceService';
import reservationService from '../../services/reservationService';

const InvoiceForm = ({ invoice, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    reservation_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: ''
  });

  useEffect(() => {
    fetchReservations();
    if (invoice) {
      setFormData({
        reservation_id: invoice.reservation_id || '',
        invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || '',
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        discount: invoice.discount || 0,
        total: invoice.total || 0,
        notes: invoice.notes || ''
      });
    }
  }, [invoice]);

  const fetchReservations = async () => {
    try {
      const response = await reservationService.getReservations(1, 100);
      setReservations(response.data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReservationSelect = async (e) => {
    const reservationId = e.target.value;
    setFormData(prev => ({ ...prev, reservation_id: reservationId }));
    
    if (reservationId) {
      try {
        const response = await reservationService.getReservation(reservationId);
        const res = response.data;
        // Auto-calculate invoice from reservation
        setFormData(prev => ({
          ...prev,
          subtotal: res.total_amount || 0,
          tax: res.tax || 0,
          total: res.total_amount || 0
        }));
      } catch (error) {
        console.error('Error fetching reservation details:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reservation_id) {
      toast.error('Please select a reservation');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        subtotal: parseFloat(formData.subtotal),
        tax: parseFloat(formData.tax),
        discount: parseFloat(formData.discount),
        total: parseFloat(formData.total)
      };

      if (invoice) {
        await invoiceService.updateInvoice(invoice.id, data);
        toast.success('Invoice updated successfully');
      } else {
        await invoiceService.createInvoice(data);
        toast.success('Invoice created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FaFileInvoice className="text-primary-600" />
            {invoice ? 'Edit Invoice' : 'Generate Invoice'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reservation Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reservation <span className="text-red-500">*</span>
            </label>
            <select
              name="reservation_id"
              value={formData.reservation_id}
              onChange={handleReservationSelect}
              className="input-field"
              required
            >
              <option value="">Select Reservation</option>
              {reservations.map((res) => (
                <option key={res.id} value={res.id}>
                  #{res.reservation_number} - {res.first_name} {res.last_name} - Room {res.room_number}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Amount Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtotal
              </label>
              <input
                type="number"
                name="subtotal"
                value={formData.subtotal}
                onChange={handleChange}
                className="input-field"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax
              </label>
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                className="input-field"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                className="input-field"
                step="0.01"
                min="0"
              />
            </div>

            <div className="border-t border-gray-200 pt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount
              </label>
              <input
                type="number"
                name="total"
                value={formData.total}
                onChange={handleChange}
                className="input-field font-bold text-primary-600"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="input-field"
              placeholder="Invoice notes..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Generating...' : (invoice ? 'Update Invoice' : 'Generate Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;