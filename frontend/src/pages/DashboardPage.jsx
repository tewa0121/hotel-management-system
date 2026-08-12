// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import toast from 'react-hot-toast';
// import {
//   FaBed,
//   FaUsers,
//   FaMoneyBillWave,
//   FaCalendarCheck,
//   FaDoorOpen,
//   FaExclamationTriangle,
//   FaCheckCircle,
//   FaClock,
//   FaChartLine,
//   FaCreditCard
// } from 'react-icons/fa';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
//   PointElement,
//   LineElement,
//   Filler  // Added Filler
// } from 'chart.js';
// import { Bar, Pie, Line } from 'react-chartjs-2';
// import dashboardService from '../services/dashboardService';

// // Register ChartJS components - including Filler
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ArcElement,
//   PointElement,
//   LineElement,
//   Filler  // Added Filler
// );

// const DashboardPage = () => {
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     totalRooms: 0,
//     availableRooms: 0,
//     occupiedRooms: 0,
//     reservedRooms: 0,
//     dirtyRooms: 0,
//     occupancyRate: 0,
//     todayArrivals: 0,
//     todayDepartures: 0,
//     currentGuests: 0,
//     todayRevenue: 0,
//     monthlyRevenue: 0,
//     totalGuests: 0,
//     outstandingBalance: 0
//   });
//   const [occupancyData, setOccupancyData] = useState([]);
//   const [revenueData, setRevenueData] = useState([]);
//   const [paymentBreakdown, setPaymentBreakdown] = useState([]);
//   const [recentActivity, setRecentActivity] = useState([]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch all data in parallel with error handling for each
//       const results = await Promise.allSettled([
//         dashboardService.getStats(),
//         dashboardService.getOccupancyData(30),
//         dashboardService.getRevenueData('monthly'),
//         dashboardService.getPaymentBreakdown(),
//         dashboardService.getRecentActivity(10)
//       ]);

//       // Process each result with proper error handling
//       const [statsRes, occupancyRes, revenueRes, paymentRes, activityRes] = results;

//       if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
//         setStats(statsRes.value.data);
//       } else {
//         console.warn('Stats data not available, using defaults');
//       }

//       if (occupancyRes.status === 'fulfilled' && occupancyRes.value?.success) {
//         setOccupancyData(occupancyRes.value.data || []);
//       } else {
//         // Generate sample occupancy data
//         const sampleData = [];
//         for (let i = 29; i >= 0; i--) {
//           const date = new Date();
//           date.setDate(date.getDate() - i);
//           sampleData.push({
//             date: date.toISOString().split('T')[0],
//             occupied: Math.floor(Math.random() * 20) + 5,
//             reserved: Math.floor(Math.random() * 10) + 2
//           });
//         }
//         setOccupancyData(sampleData);
//       }

//       if (revenueRes.status === 'fulfilled' && revenueRes.value?.success) {
//         setRevenueData(revenueRes.value.data || []);
//       } else {
//         // Generate sample revenue data
//         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
//         const sampleData = months.map(month => ({
//           label: month,
//           revenue: Math.floor(Math.random() * 5000) + 1000
//         }));
//         setRevenueData(sampleData);
//       }

//       if (paymentRes.status === 'fulfilled' && paymentRes.value?.success) {
//         setPaymentBreakdown(paymentRes.value.data || []);
//       } else {
//         // Generate sample payment data
//         setPaymentBreakdown([
//           { payment_method: 'cash', total: 4500 },
//           { payment_method: 'credit_card', total: 8200 },
//           { payment_method: 'bank_transfer', total: 3100 }
//         ]);
//       }

//       if (activityRes.status === 'fulfilled' && activityRes.value?.success) {
//         setRecentActivity(activityRes.value.data || []);
//       } else {
//         setRecentActivity([]);
//       }
      
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//       toast.error('Failed to load some dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Chart configurations with safe data handling
//   const occupancyChartData = {
//     labels: occupancyData.map(d => d.date) || [],
//     datasets: [
//       {
//         label: 'Occupied',
//         data: occupancyData.map(d => d.occupied || 0) || [],
//         backgroundColor: 'rgba(59, 130, 246, 0.5)',
//         borderColor: 'rgb(59, 130, 246)',
//         borderWidth: 2
//       },
//       {
//         label: 'Reserved',
//         data: occupancyData.map(d => d.reserved || 0) || [],
//         backgroundColor: 'rgba(251, 191, 36, 0.5)',
//         borderColor: 'rgb(251, 191, 36)',
//         borderWidth: 2
//       }
//     ]
//   };

//   const revenueChartData = {
//     labels: revenueData.map(d => d.label) || [],
//     datasets: [{
//       label: 'Revenue',
//       data: revenueData.map(d => d.revenue || 0) || [],
//       backgroundColor: 'rgba(16, 185, 129, 0.2)',
//       borderColor: 'rgb(16, 185, 129)',
//       borderWidth: 2,
//       fill: true,
//       tension: 0.4
//     }]
//   };

//   const paymentChartData = {
//     labels: paymentBreakdown.map(d => 
//       d.payment_method?.replace('_', ' ') || 'Other'
//     ) || [],
//     datasets: [{
//       data: paymentBreakdown.map(d => d.total || 0) || [],
//       backgroundColor: [
//         '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
//       ],
//       borderWidth: 1
//     }]
//   };

//   const StatCard = ({ icon: Icon, title, value, color, subtitle, prefix = '' }) => (
//     <div className="card hover:shadow-lg transition-all duration-300">
//       <div className="flex items-start justify-between">
//         <div>
//           <p className="text-sm text-gray-600">{title}</p>
//           <p className="text-2xl font-bold text-gray-900 mt-1">
//             {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
//           </p>
//           {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
//         </div>
//         <div className={`p-3 rounded-lg ${color}`}>
//           <Icon className="h-6 w-6 text-white" />
//         </div>
//       </div>
//     </div>
//   );

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       {/* Welcome Header */}
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-gray-900">
//           Welcome back, {user?.name || 'User'}! 👋
//         </h1>
//         <p className="text-gray-600 mt-1">Here's what's happening with your hotel today</p>
//       </div>

//       {/* Stats Grid - Row 1 */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         <StatCard
//           icon={FaBed}
//           title="Total Rooms"
//           value={stats.totalRooms || 0}
//           color="bg-primary-500"
//           subtitle={`${stats.availableRooms || 0} available • ${stats.occupiedRooms || 0} occupied`}
//         />
//         <StatCard
//           icon={FaDoorOpen}
//           title="Occupancy Rate"
//           value={`${stats.occupancyRate || 0}%`}
//           color="bg-green-500"
//           subtitle={`${stats.occupiedRooms || 0} rooms occupied`}
//         />
//         <StatCard
//           icon={FaUsers}
//           title="Current Guests"
//           value={stats.currentGuests || 0}
//           color="bg-blue-500"
//           subtitle={`${stats.todayArrivals || 0} arriving today`}
//         />
//         <StatCard
//           icon={FaMoneyBillWave}
//           title="Monthly Revenue"
//           value={stats.monthlyRevenue || 0}
//           color="bg-yellow-500"
//           prefix="$"
//           subtitle={`$${(stats.todayRevenue || 0).toLocaleString()} today`}
//         />
//       </div>

//       {/* Stats Grid - Row 2 */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//         <StatCard
//           icon={FaCalendarCheck}
//           title="Today's Arrivals"
//           value={stats.todayArrivals || 0}
//           color="bg-indigo-500"
//         />
//         <StatCard
//           icon={FaClock}
//           title="Today's Departures"
//           value={stats.todayDepartures || 0}
//           color="bg-purple-500"
//         />
//         <StatCard
//           icon={FaExclamationTriangle}
//           title="Dirty Rooms"
//           value={stats.dirtyRooms || 0}
//           color="bg-red-500"
//           subtitle="Need cleaning"
//         />
//         <StatCard
//           icon={FaCreditCard}
//           title="Outstanding Balance"
//           value={stats.outstandingBalance || 0}
//           color="bg-orange-500"
//           prefix="$"
//         />
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//         {/* Occupancy Chart */}
//         <div className="card">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//             <FaChartLine className="text-primary-500" />
//             Room Occupancy (30 Days)
//           </h3>
//           <div className="h-64">
//             {occupancyData.length > 0 ? (
//               <Bar 
//                 data={occupancyChartData} 
//                 options={{
//                   responsive: true,
//                   maintainAspectRatio: false,
//                   plugins: {
//                     legend: {
//                       position: 'top',
//                     }
//                   },
//                   scales: {
//                     y: {
//                       beginAtZero: true
//                     }
//                   }
//                 }}
//               />
//             ) : (
//               <div className="flex items-center justify-center h-full text-gray-500">
//                 No occupancy data available
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Revenue Chart */}
//         <div className="card">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//             <FaMoneyBillWave className="text-green-500" />
//             Monthly Revenue
//           </h3>
//           <div className="h-64">
//             {revenueData.length > 0 ? (
//               <Line 
//                 data={revenueChartData}
//                 options={{
//                   responsive: true,
//                   maintainAspectRatio: false,
//                   plugins: {
//                     legend: {
//                       position: 'top',
//                     }
//                   },
//                   scales: {
//                     y: {
//                       beginAtZero: true,
//                       ticks: {
//                         callback: (value) => '$' + value
//                       }
//                     }
//                   }
//                 }}
//               />
//             ) : (
//               <div className="flex items-center justify-center h-full text-gray-500">
//                 No revenue data available
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Third Row - Payment Breakdown */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//         {/* Payment Method Breakdown */}
//         <div className="card lg:col-span-1">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//             <FaCreditCard className="text-purple-500" />
//             Payment Methods
//           </h3>
//           <div className="h-48">
//             {paymentBreakdown.length > 0 ? (
//               <Pie 
//                 data={paymentChartData}
//                 options={{
//                   responsive: true,
//                   maintainAspectRatio: false,
//                   plugins: {
//                     legend: {
//                       position: 'bottom',
//                       labels: {
//                         boxWidth: 10,
//                         padding: 10,
//                         font: {
//                           size: 10
//                         }
//                       }
//                     }
//                   }
//                 }}
//               />
//             ) : (
//               <div className="flex items-center justify-center h-full text-gray-500">
//                 No payment data available
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Recent Activity */}
//         <div className="card lg:col-span-2">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
//           <div className="space-y-3 max-h-64 overflow-y-auto">
//             {recentActivity.length === 0 ? (
//               <p className="text-gray-500 text-center py-4">No recent activity</p>
//             ) : (
//               recentActivity.map((activity, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                   <div className="flex items-center gap-3">
//                     {activity.type === 'reservation' ? (
//                       <FaCalendarCheck className="text-blue-500" />
//                     ) : (
//                       <FaMoneyBillWave className="text-green-500" />
//                     )}
//                     <div>
//                       <p className="text-sm font-medium text-gray-900">
//                         {activity.type === 'reservation' ? 'Reservation' : 'Payment'}
//                         {activity.guest_name && ` - ${activity.guest_name}`}
//                       </p>
//                       <p className="text-xs text-gray-500">
//                         {activity.type === 'reservation' 
//                           ? `Room ${activity.room_number || ''} • ${activity.status || 'Pending'}`
//                           : `$${activity.amount || 0} • ${activity.payment_method?.replace('_', ' ') || ''}`
//                         }
//                       </p>
//                     </div>
//                   </div>
//                   <span className="text-xs text-gray-400">
//                     {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ''}
//                   </span>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardPage;