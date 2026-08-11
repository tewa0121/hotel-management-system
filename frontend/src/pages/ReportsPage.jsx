import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaChartBar, FaFileDownload, FaCalendar } from 'react-icons/fa';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('occupancy');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'occupancy', label: 'Occupancy Report' },
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'reservations', label: 'Reservations Report' },
    { value: 'guests', label: 'Guests Report' },
    { value: 'payments', label: 'Payments Report' }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and view hotel performance reports</p>
      </div>

      {/* Report Selector */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex gap-2">
              <input type="date" className="input-field flex-1" />
              <input type="date" className="input-field flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {reportTypes.find(r => r.value === reportType)?.label || 'Report'}
          </h2>
          <button className="btn-primary flex items-center">
            <FaFileDownload className="mr-2" />
            Export
          </button>
        </div>

        {/* Placeholder for charts */}
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaChartBar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Report charts and data will appear here</p>
          <p className="text-sm text-gray-400 mt-1">Select a date range and click generate</p>
          <button className="mt-4 btn-primary">
            <FaCalendar className="inline mr-2" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;