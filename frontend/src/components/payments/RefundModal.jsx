import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const RefundModal = ({ isOpen, onClose, onConfirm, payment }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      alert('Please enter a refund reason');
      return;
    }
    onConfirm(trimmedReason);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Refund Payment</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Payment Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-bold text-primary-600">
                ${parseFloat(payment?.amount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Guest</span>
              <span className="font-medium">{payment?.first_name} {payment?.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reservation</span>
              <span className="font-medium">#{payment?.reservation_number}</span>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              className="input-field"
              placeholder="Enter reason for refund..."
              required
              autoFocus
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ This action will:
            <ul className="list-disc list-inside mt-1 text-xs">
              <li>Mark this payment as refunded</li>
              <li>Update the reservation balance</li>
              <li>Cannot be undone</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary bg-orange-600 hover:bg-orange-700">
              Confirm Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundModal;