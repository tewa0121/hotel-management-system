import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaCreditCard, 
  FaSearch, 
  FaPlus, 
  FaUndo,
  FaMoneyBillWave,
  FaCalendar,
  FaUser,
  FaBed
} from 'react-icons/fa';
import paymentService from '../services/paymentService';
import PaymentForm from '../components/payments/PaymentForm';
import RefundModal from '../components/payments/RefundModal';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [selectedGuestId, setSelectedGuestId] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPayments(1, 50, filterStatus);
      setPayments(response.data || []);
    } catch (error) {
      toast.error('Failed to load payments');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Open Refund Modal
  const openRefundModal = (payment) => {
    console.log('🔄 Opening refund modal for payment:', payment.id);
    setRefundPayment(payment);
    setRefundModalOpen(true);
  };

  // ✅ Close Refund Modal
  const closeRefundModal = () => {
    setRefundModalOpen(false);
    setRefundPayment(null);
  };

  // ✅ Confirm Refund
  const confirmRefund = async (reason) => {
    if (!refundPayment) return;
    
    console.log('📤 Processing refund for payment:', refundPayment.id);
    console.log('📝 Reason:', reason);
    
    try {
      const response = await paymentService.refundPayment(refundPayment.id, reason);
      console.log('📥 Response:', response);
      
      if (response && response.success) {
        toast.success('✅ Payment refunded successfully!');
        closeRefundModal();
        await fetchPayments();
      } else {
        toast.error(response?.message || 'Failed to refund payment');
      }
    } catch (error) {
      console.error('❌ Refund error:', error);
      toast.error(error.message || 'Failed to refund payment');
    }
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: '💰',
      credit_card: '💳',
      debit_card: '💳',
      bank_transfer: '🏦',
      mobile_money: '📱',
      other: '💵'
    };
    return icons[method] || '💵';
  };

  // Filter payments by search
  const filteredPayments = payments.filter(payment => {
    const matchSearch = 
      `${payment.first_name} ${payment.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      payment.reservation_number?.toLowerCase().includes(search.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Stats
  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    refunded: payments.filter(p => p.status === 'refunded').length
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage all guest payments and transactions</p>
        </div>
        <button
          onClick={() => {
            setSelectedReservationId(null);
            setSelectedGuestId(null);
            setShowForm(true);
          }}
          className="mt-3 sm:mt-0 btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Record Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaCreditCard className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaMoneyBillWave className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaCalendar className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Refunded</p>
              <p className="text-2xl font-bold text-gray-600">{stats.refunded}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaUndo className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by guest name, reservation #, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <button onClick={fetchPayments} className="btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading payments...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="card text-center py-12">
          <FaCreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No payments found</p>
          <p className="text-gray-400 text-sm">Record your first payment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Payment Info */}
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">
                    {getPaymentMethodIcon(payment.payment_method)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {payment.first_name} {payment.last_name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status || 'Completed'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <FaCreditCard className="h-3 w-3" />
                        Reservation #{payment.reservation_number}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 capitalize">
                        {payment.payment_method?.replace('_', ' ')}
                      </span>
                      {payment.reference_number && (
                        <>
                          <span>•</span>
                          <span className="text-xs text-gray-400">
                            Ref: {payment.reference_number}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      <FaCalendar className="inline h-3 w-3 mr-1" />
                      {new Date(payment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      ${payment.amount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.currency || 'USD'}
                    </p>
                  </div>

                  {/* ✅ REFUND BUTTON - OPENS MODAL */}
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => openRefundModal(payment)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Refund this payment"
                    >
                      <FaUndo className="h-4 w-4" />
                    </button>
                  )}
                  
                  {payment.status === 'refunded' && (
                    <span className="text-xs text-gray-400 font-medium">Refunded</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Form Modal */}
      {showForm && (
        <PaymentForm
          reservationId={selectedReservationId}
          guestId={selectedGuestId}
          onClose={() => {
            setShowForm(false);
            setSelectedReservationId(null);
            setSelectedGuestId(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedReservationId(null);
            setSelectedGuestId(null);
            fetchPayments();
          }}
        />
      )}

      {/* ✅ REFUND MODAL */}
      <RefundModal
        isOpen={refundModalOpen}
        onClose={closeRefundModal}
        onConfirm={confirmRefund}
        payment={refundPayment}
      />
    </div>
  );
};

export default PaymentsPage;