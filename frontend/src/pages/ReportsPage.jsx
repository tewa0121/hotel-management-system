import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  FaChartBar, 
  FaFileDownload, 
  FaCalendar, 
  FaUsers,
  FaMoneyBillWave,
  FaBed,
  FaSearch
} from 'react-icons/fa';
import reportService from '../services/reportService';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('occupancy');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { value: 'occupancy', label: 'Occupancy Report', icon: FaBed },
    { value: 'revenue', label: 'Revenue Report', icon: FaMoneyBillWave },
    { value: 'reservations', label: 'Reservations Report', icon: FaCalendar },
    { value: 'guests', label: 'Guests Report', icon: FaUsers },
    { value: 'payments', label: 'Payments Report', icon: FaMoneyBillWave }
  ];

  const fetchReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error('Please select start and end dates');
      return;
    }

    try {
      setLoading(true);
      let response;

      switch(reportType) {
        case 'occupancy':
          response = await reportService.getOccupancy(dateRange.start, dateRange.end);
          break;
        case 'revenue':
          response = await reportService.getRevenue(dateRange.start, dateRange.end);
          break;
        case 'reservations':
          response = await reportService.getReservations(dateRange.start, dateRange.end);
          break;
        case 'guests':
          response = await reportService.getGuests();
          break;
        case 'payments':
          response = await reportService.getPayments(dateRange.start, dateRange.end);
          break;
        default:
          response = { data: {} };
      }

      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER FUNCTIONS - FIXED
  // ============================================

  const renderOccupancyReport = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Total Rooms</p>
            <p className="text-2xl font-bold text-gray-900">{reportData.total_rooms || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Occupied</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.occupied || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-green-600">{reportData.available || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Occupancy Rate</p>
            <p className="text-2xl font-bold text-primary-600">{reportData.occupancy_rate || 0}%</p>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueReport = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">${reportData.total_revenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        
        {/* By Payment Method */}
        {reportData.by_payment_method && reportData.by_payment_method.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">By Payment Method</h4>
            <div className="space-y-2">
              {reportData.by_payment_method.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span className="capitalize">{item.payment_method?.replace('_', ' ')}</span>
                  <span className="font-bold text-gray-900">${item.total?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Room Type */}
        {reportData.by_room_type && reportData.by_room_type.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">By Room Type</h4>
            <div className="space-y-2">
              {reportData.by_room_type.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span>{item.name || 'Unknown'}</span>
                  <span className="font-bold text-gray-900">${item.total?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReservationReport = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Total Reservations</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.total_reservations || 0}</p>
          </div>
        </div>

        {/* By Status */}
        {reportData.by_status && reportData.by_status.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">By Status</h4>
            <div className="space-y-2">
              {reportData.by_status.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span className="capitalize">{item.reservation_status?.replace('_', ' ')}</span>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Source */}
        {reportData.by_source && reportData.by_source.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">By Source</h4>
            <div className="space-y-2">
              {reportData.by_source.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span className="capitalize">{item.source}</span>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGuestReport = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Total Guests</p>
            <p className="text-2xl font-bold text-purple-600">{reportData.total_guests || 0}</p>
          </div>
        </div>

        {/* By Country */}
        {reportData.by_country && reportData.by_country.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">By Country</h4>
            <div className="space-y-2">
              {reportData.by_country.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span>{item.country || 'Unknown'}</span>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Spenders */}
        {reportData.top_spenders && reportData.top_spenders.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Top Spenders</h4>
            <div className="space-y-2">
              {reportData.top_spenders.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span>{item.first_name} {item.last_name}</span>
                  <span className="font-bold text-gray-900">${item.total_spent?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPaymentReport = () => {
    if (!reportData) return null;
    return (
      <div className="space-y-4">
        {/* By Status */}
        {reportData.by_status && reportData.by_status.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Payments by Status</h4>
            <div className="space-y-2">
              {reportData.by_status.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="capitalize">{item.status}</span>
                    <span className="text-sm text-gray-500 ml-2">({item.count} payments)</span>
                  </div>
                  <span className="font-bold text-gray-900">${item.total?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outstanding */}
        {reportData.outstanding && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Outstanding Balance</span>
              <span className="font-bold text-yellow-700">${reportData.outstanding.total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-500">Number of reservations with balance</span>
              <span className="font-bold text-yellow-700">{reportData.outstanding.count || 0}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaChartBar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a report and date range, then click Generate</p>
        </div>
      );
    }

    switch(reportType) {
      case 'occupancy':
        return renderOccupancyReport();
      case 'revenue':
        return renderRevenueReport();
      case 'reservations':
        return renderReservationReport();
      case 'guests':
        return renderGuestReport();
      case 'payments':
        return renderPaymentReport();
      default:
        return <p className="text-gray-500">Select a report type</p>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and view hotel performance reports</p>
      </div>

      {/* Report Selector */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Report</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-4">
          <button 
            onClick={fetchReport} 
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <FaSearch />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {reportTypes.find(r => r.value === reportType)?.label || 'Report'}
          </h2>
          {reportData && (
            <button className="btn-secondary flex items-center gap-2">
              <FaFileDownload />
              Export PDF
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Generating report...</p>
          </div>
        ) : (
          renderReportContent()
        )}
      </div>
    </div>
  );
};

export default ReportsPage;