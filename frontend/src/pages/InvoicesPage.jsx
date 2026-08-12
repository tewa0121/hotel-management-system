import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaFileInvoice, 
  FaSearch, 
  FaPlus, 
  FaDownload, 
  FaEnvelope,
  FaPrint,
  FaMoneyBillWave,
  FaCalendar,
  FaUser
} from 'react-icons/fa';
import invoiceService from '../services/invoiceService';
import InvoiceForm from '../components/invoices/InvoiceForm';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoices(1, 50, filterStatus);
      setInvoices(response.data || []);
    } catch (error) {
      toast.error('Failed to load invoices');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await invoiceService.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleSendEmail = async (id) => {
    const email = prompt('Enter email address to send invoice:');
    if (!email) return;
    
    try {
      await invoiceService.sendInvoiceEmail(id, email);
      toast.success(`Invoice sent to ${email}`);
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handlePrint = (id) => {
    window.open(`/api/invoices/${id}/print`, '_blank');
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter invoices by search
  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = 
      `${inv.first_name} ${inv.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.reservation_number?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // ✅ FIXED: Convert to number before using toFixed
  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return num.toFixed(2);
  };

  // Stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0)
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage guest invoices and billing</p>
        </div>
        <button
          onClick={() => {
            setEditingInvoice(null);
            setShowForm(true);
          }}
          className="mt-3 sm:mt-0 btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Generate Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaFileInvoice className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaMoneyBillWave className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FaCalendar className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              {/* ✅ FIXED: Use formatCurrency helper */}
              <p className="text-2xl font-bold text-primary-600">
                ${formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <FaMoneyBillWave className="h-5 w-5 text-primary-600" />
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
              placeholder="Search by guest name, invoice #, or reservation #..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button onClick={fetchInvoices} className="btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card text-center py-12">
          <FaFileInvoice className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No invoices found</p>
          <p className="text-gray-400 text-sm">Generate your first invoice</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Invoice Info */}
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">
                    <FaFileInvoice className="text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {invoice.first_name} {invoice.last_name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status || 'Draft'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <FaFileInvoice className="h-3 w-3" />
                        #{invoice.invoice_number}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaUser className="h-3 w-3" />
                        Res: #{invoice.reservation_number}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaCalendar className="h-3 w-3" />
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {/* ✅ FIXED: Use formatCurrency helper */}
                    <p className="text-lg font-bold text-primary-600">
                      ${formatCurrency(invoice.total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Paid: ${formatCurrency(invoice.paid_amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(invoice.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <FaDownload className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePrint(invoice.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Print"
                    >
                      <FaPrint className="h-4 w-4" />
                    </button>
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => handleSendEmail(invoice.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <FaEnvelope className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Form Modal */}
      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingInvoice(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
};

export default InvoicesPage;