
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

// ============================================
// FORMATTERS
// ============================================

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return num.toFixed(2);
};

const formatNumber = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString();
};

const formatLabel = (value) => {
  if (!value) return 'Unknown';

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ============================================
// REPORT PAGE
// ============================================

const ReportsPage = () => {
  const [reportType, setReportType] = useState('occupancy');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const [reportData, setReportData] = useState(null);

  // ============================================
  // REPORT TYPES
  // ============================================

  const reportTypes = [
    {
      value: 'occupancy',
      label: 'Occupancy Report',
      icon: FaBed,
      requiresDates: true
    },
    {
      value: 'revenue',
      label: 'Revenue Report',
      icon: FaMoneyBillWave,
      requiresDates: true
    },
    {
      value: 'reservations',
      label: 'Reservations Report',
      icon: FaCalendar,
      requiresDates: true
    },
    {
      value: 'guests',
      label: 'Guests Report',
      icon: FaUsers,
      requiresDates: false
    },
    {
      value: 'payments',
      label: 'Payments Report',
      icon: FaMoneyBillWave,
      requiresDates: true
    }
  ];

  // ============================================
  // GET CURRENT REPORT LABEL
  // ============================================

  const getReportLabel = () => {
    return (
      reportTypes.find((report) => report.value === reportType)?.label ||
      'Report'
    );
  };

  // ============================================
  // FETCH REPORT
  // ============================================

  const fetchReport = async () => {
    const selectedReport = reportTypes.find(
      (report) => report.value === reportType
    );

    // Guests report does not require dates
    if (selectedReport?.requiresDates) {
      if (!dateRange.start || !dateRange.end) {
        toast.error('Please select start and end dates');
        return;
      }

      if (dateRange.start > dateRange.end) {
        toast.error('Start date cannot be after end date');
        return;
      }
    }

    try {
      setLoading(true);
      setReportData(null);

      let response;

      switch (reportType) {
        case 'occupancy':
          response = await reportService.getOccupancy(
            dateRange.start,
            dateRange.end
          );
          break;

        case 'revenue':
          response = await reportService.getRevenue(
            dateRange.start,
            dateRange.end
          );
          break;

        case 'reservations':
          response = await reportService.getReservations(
            dateRange.start,
            dateRange.end
          );
          break;

        case 'guests':
          response = await reportService.getGuests();
          break;

        case 'payments':
          response = await reportService.getPayments(
            dateRange.start,
            dateRange.end
          );
          break;

        default:
          response = { data: {} };
      }

      // reportService returns response.data from Axios
      const data = response?.data || {};

      setReportData(data);

      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Report generation error:', error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        error?.error ||
        'Failed to generate report';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EXPORT PDF
  // ============================================

  const exportPDF = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    try {
      setExporting(true);

      const doc = new jsPDF();

      const reportLabel = getReportLabel();

      // ========================================
      // PDF HEADER
      // ========================================

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Hotel HMS', 14, 20);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(reportLabel, 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      if (dateRange.start && dateRange.end) {
        doc.text(
          `Period: ${dateRange.start} to ${dateRange.end}`,
          14,
          38
        );
      } else {
        doc.text('Period: All available data', 14, 38);
      }

      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        14,
        45
      );

      doc.setTextColor(0, 0, 0);

      let currentY = 55;

      // ========================================
      // OCCUPANCY REPORT
      // ========================================

      if (reportType === 'occupancy') {
        autoTable(doc, {
          startY: currentY,
          head: [['Metric', 'Value']],
          body: [
            [
              'Total Rooms',
              formatNumber(reportData.total_rooms)
            ],
            [
              'Occupied Rooms',
              formatNumber(reportData.occupied)
            ],
            [
              'Reserved Rooms',
              formatNumber(reportData.reserved)
            ],
            [
              'Available Rooms',
              formatNumber(reportData.available)
            ],
            [
              'Occupancy Rate',
              `${formatNumber(reportData.occupancy_rate)}%`
            ]
          ],
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 4
          },
          headStyles: {
            fontStyle: 'bold'
          }
        });
      }

      // ========================================
      // REVENUE REPORT
      // ========================================

      if (reportType === 'revenue') {
        autoTable(doc, {
          startY: currentY,
          head: [['Metric', 'Amount']],
          body: [
            [
              'Total Revenue',
              `$${formatCurrency(reportData.total_revenue)}`
            ]
          ],
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 4
          }
        });

        currentY = doc.lastAutoTable
          ? doc.lastAutoTable.finalY + 10
          : 75;

        // Revenue by payment method
        if (
          Array.isArray(reportData.by_payment_method) &&
          reportData.by_payment_method.length > 0
        ) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(
            'Revenue by Payment Method',
            14,
            currentY
          );

          autoTable(doc, {
            startY: currentY + 5,
            head: [['Payment Method', 'Total']],
            body: reportData.by_payment_method.map((item) => [
              formatLabel(item.payment_method),
              `$${formatCurrency(item.total)}`
            ]),
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4
            }
          });

          currentY = doc.lastAutoTable
            ? doc.lastAutoTable.finalY + 10
            : currentY + 40;
        }

        // Revenue by room type
        if (
          Array.isArray(reportData.by_room_type) &&
          reportData.by_room_type.length > 0
        ) {
          // Start a new page if necessary
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(
            'Revenue by Room Type',
            14,
            currentY
          );

          autoTable(doc, {
            startY: currentY + 5,
            head: [['Room Type', 'Total']],
            body: reportData.by_room_type.map((item) => [
              item.name || 'Unknown',
              `$${formatCurrency(item.total)}`
            ]),
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4
            }
          });
        }
      }

      // ========================================
      // RESERVATIONS REPORT
      // ========================================

      if (reportType === 'reservations') {
        autoTable(doc, {
          startY: currentY,
          head: [['Metric', 'Value']],
          body: [
            [
              'Total Reservations',
              formatNumber(reportData.total_reservations)
            ]
          ],
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 4
          }
        });

        currentY = doc.lastAutoTable
          ? doc.lastAutoTable.finalY + 10
          : 75;

        // By status
        if (
          Array.isArray(reportData.by_status) &&
          reportData.by_status.length > 0
        ) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(
            'Reservations by Status',
            14,
            currentY
          );

          autoTable(doc, {
            startY: currentY + 5,
            head: [['Status', 'Count']],
            body: reportData.by_status.map((item) => [
              formatLabel(item.reservation_status),
              formatNumber(item.count)
            ]),
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4
            }
          });

          currentY = doc.lastAutoTable
            ? doc.lastAutoTable.finalY + 10
            : currentY + 40;
        }

        // By source
        if (
          Array.isArray(reportData.by_source) &&
          reportData.by_source.length > 0
        ) {
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(
            'Reservations by Source',
            14,
            currentY
          );

          autoTable(doc, {
            startY: currentY + 5,
            head: [['Source', 'Count']],
            body: reportData.by_source.map((item) => [
              formatLabel(item.source),
              formatNumber(item.count)
            ]),
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4
            }
          });
        }
      }

      // ========================================
      // GUESTS REPORT
      // ========================================

      if (reportType === 'guests') {
        autoTable(doc, {
          startY: currentY,
          head: [['Metric', 'Value']],
          body: [
            [
              'Total Guests',
              formatNumber(reportData.total_guests)
            ]
          ],
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 4
          }
        });

        currentY = doc.lastAutoTable
          ? doc.lastAutoTable.finalY + 10
          : 75;

        // Guests by country
        if (
          Array.isArray(reportData.by_country) &&
          reportData.by_country.length > 0
        ) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(
            'Guests by Country',
            14,
            currentY
          );

          autoTable(doc, {
            startY: currentY + 5,
            head: [['Country', 'Guests']],
            body: reportData.by_country.map((item) => [
              item.country || 'Unknown',
              formatNumber(item.count)
            ]),
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4
            }
          });

          currentY = doc.lastAutoTable
            ? doc.lastAutoTable.finalY + 10
            : currentY + 40;
        }

        // Top spenders
        if (
          Array.isArray(reportData.top_spenders) &&
          reportData.top_spenders.length > 0
        ) {
          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(
            'Top Spenders',
            14,
            currentY
          );

          autoTable(doc, {
            startY: currentY + 5,
            head: [['Guest', 'Email', 'Total Spent']],
            body: reportData.top_spenders.map((item) => [
              `${item.first_name || ''} ${
                item.last_name || ''
              }`.trim() || 'Unknown',
              item.email || '',
              `$${formatCurrency(item.total_spent)}`
            ]),
            theme: 'grid',
            styles: {
              fontSize: 9,
              cellPadding: 4
            }
          });
        }
      }

      // ========================================
      // PAYMENTS REPORT
      // ========================================

      if (reportType === 'payments') {
        if (
          Array.isArray(reportData.by_status) &&
          reportData.by_status.length > 0
        ) {
          autoTable(doc, {
            startY: currentY,
            head: [['Status', 'Payments', 'Total']],
            body: reportData.by_status.map((item) => [
              formatLabel(item.status),
              formatNumber(item.count),
              `$${formatCurrency(item.total)}`
            ]),
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4
            }
          });

          currentY = doc.lastAutoTable
            ? doc.lastAutoTable.finalY + 10
            : currentY + 40;
        }

        if (reportData.outstanding) {
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(
            'Outstanding Balance',
            14,
            currentY
          );

          autoTable(doc, {
            startY: currentY + 5,
            head: [['Metric', 'Value']],
            body: [
              [
                'Outstanding Amount',
                `$${formatCurrency(
                  reportData.outstanding.total
                )}`
              ],
              [
                'Reservations with Balance',
                formatNumber(
                  reportData.outstanding.count
                )
              ]
            ],
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4
            }
          });
        }
      }

      // ========================================
      // PDF FOOTER
      // ========================================

      const pageCount = doc.internal.getNumberOfPages();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        const pageHeight =
          doc.internal.pageSize.getHeight();

        const pageWidth =
          doc.internal.pageSize.getWidth();

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);

        doc.text(
          `Hotel HMS | ${reportLabel}`,
          14,
          pageHeight - 10
        );

        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - 40,
          pageHeight - 10
        );
      }

      // ========================================
      // SAVE FILE
      // ========================================

      const safeReportName = reportLabel
        .replace(/\s+/g, '-')
        .toLowerCase();

      const filename =
        dateRange.start && dateRange.end
          ? `${safeReportName}-${dateRange.start}-${dateRange.end}.pdf`
          : `${safeReportName}-${new Date()
              .toISOString()
              .slice(0, 10)}.pdf`;

      doc.save(filename);

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(
        error?.message || 'Failed to export PDF'
      );
    } finally {
      setExporting(false);
    }
  };

  // ============================================
  // OCCUPANCY REPORT
  // ============================================

  const renderOccupancyReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Total Rooms
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(reportData.total_rooms)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Occupied
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(reportData.occupied)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Available
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(reportData.available)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Occupancy Rate
            </p>
            <p className="text-2xl font-bold text-primary-600">
              {formatNumber(reportData.occupancy_rate)}%
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // REVENUE REPORT
  // ============================================

  const renderRevenueReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-green-600">
              ${formatCurrency(reportData.total_revenue)}
            </p>
          </div>
        </div>

        {Array.isArray(reportData.by_payment_method) &&
          reportData.by_payment_method.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                By Payment Method
              </h4>

              <div className="space-y-2">
                {reportData.by_payment_method.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <span className="capitalize">
                        {formatLabel(item.payment_method)}
                      </span>

                      <span className="font-bold text-gray-900">
                        ${formatCurrency(item.total)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {Array.isArray(reportData.by_room_type) &&
          reportData.by_room_type.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                By Room Type
              </h4>

              <div className="space-y-2">
                {reportData.by_room_type.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <span>
                        {item.name || 'Unknown'}
                      </span>

                      <span className="font-bold text-gray-900">
                        ${formatCurrency(item.total)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>
    );
  };

  // ============================================
  // RESERVATION REPORT
  // ============================================

  const renderReservationReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Total Reservations
            </p>

            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(
                reportData.total_reservations
              )}
            </p>
          </div>
        </div>

        {Array.isArray(reportData.by_status) &&
          reportData.by_status.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                By Status
              </h4>

              <div className="space-y-2">
                {reportData.by_status.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <span className="capitalize">
                        {formatLabel(
                          item.reservation_status
                        )}
                      </span>

                      <span className="font-bold text-gray-900">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {Array.isArray(reportData.by_source) &&
          reportData.by_source.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                By Source
              </h4>

              <div className="space-y-2">
                {reportData.by_source.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <span className="capitalize">
                        {formatLabel(item.source)}
                      </span>

                      <span className="font-bold text-gray-900">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>
    );
  };

  // ============================================
  // GUEST REPORT
  // ============================================

  const renderGuestReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              Total Guests
            </p>

            <p className="text-2xl font-bold text-purple-600">
              {formatNumber(reportData.total_guests)}
            </p>
          </div>
        </div>

        {Array.isArray(reportData.by_country) &&
          reportData.by_country.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                By Country
              </h4>

              <div className="space-y-2">
                {reportData.by_country.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <span>
                        {item.country || 'Unknown'}
                      </span>

                      <span className="font-bold text-gray-900">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {Array.isArray(reportData.top_spenders) &&
          reportData.top_spenders.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Top Spenders
              </h4>

              <div className="space-y-2">
                {reportData.top_spenders.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <span>
                        {item.first_name || ''}{' '}
                        {item.last_name || ''}
                      </span>

                      <span className="font-bold text-gray-900">
                        ${formatCurrency(item.total_spent)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>
    );
  };

  // ============================================
  // PAYMENT REPORT
  // ============================================

  const renderPaymentReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-4">
        {Array.isArray(reportData.by_status) &&
          reportData.by_status.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Payments by Status
              </h4>

              <div className="space-y-2">
                {reportData.by_status.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <div>
                        <span className="capitalize">
                          {formatLabel(item.status)}
                        </span>

                        <span className="text-sm text-gray-500 ml-2">
                          ({formatNumber(item.count)} payments)
                        </span>
                      </div>

                      <span className="font-bold text-gray-900">
                        ${formatCurrency(item.total)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {reportData.outstanding && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                Outstanding Balance
              </span>

              <span className="font-bold text-yellow-700">
                $
                {formatCurrency(
                  reportData.outstanding.total
                )}
              </span>
            </div>

            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-500">
                Number of reservations with balance
              </span>

              <span className="font-bold text-yellow-700">
                {formatNumber(
                  reportData.outstanding.count
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // REPORT CONTENT
  // ============================================

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaChartBar className="h-16 w-16 text-gray-300 mx-auto mb-4" />

          <p className="text-gray-500">
            Select a report and date range, then click Generate
          </p>
        </div>
      );
    }

    switch (reportType) {
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
        return (
          <p className="text-gray-500">
            Select a report type
          </p>
        );
    }
  };

  // ============================================
  // RENDER PAGE
  // ============================================

  const selectedReport = reportTypes.find(
    (report) => report.value === reportType
  );

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports
        </h1>

        <p className="text-gray-600 mt-1">
          Generate and view hotel performance reports
        </p>
      </div>

      {/* REPORT SELECTOR */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* REPORT TYPE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Report
            </label>

            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReportData(null);
              }}
              className="input-field"
            >
              {reportTypes.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* START DATE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
              {!selectedReport?.requiresDates && (
                <span className="text-gray-400 ml-1">
                  (optional)
                </span>
              )}
            </label>

            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  start: e.target.value
                })
              }
              className="input-field"
            />
          </div>

          {/* END DATE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
              {!selectedReport?.requiresDates && (
                <span className="text-gray-400 ml-1">
                  (optional)
                </span>
              )}
            </label>

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({
                  ...dateRange,
                  end: e.target.value
                })
              }
              className="input-field"
            />
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <div className="mt-4">
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <FaSearch />

            {loading
              ? 'Generating...'
              : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* REPORT CONTENT CARD */}
      <div className="card">
        {/* REPORT HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {getReportLabel()}
          </h2>

          {reportData && (
            <button
              type="button"
              onClick={exportPDF}
              disabled={exporting}
              className="btn-secondary flex items-center gap-2"
            >
              <FaFileDownload />

              {exporting
                ? 'Exporting...'
                : 'Export PDF'}
            </button>
          )}
        </div>

        {/* REPORT BODY */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>

            <p className="mt-3 text-gray-600">
              Generating report...
            </p>
          </div>
        ) : (
          renderReportContent()
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
