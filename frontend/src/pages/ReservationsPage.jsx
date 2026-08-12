// import React, { useState, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import { 
//     FaPlus, 
//     FaCalendarCheck, 
//     FaUser, 
//     FaBed, 
//     FaSearch,
//     FaEdit,
//     FaTrash,
//     FaCheckCircle,
//     FaTimesCircle,
//     FaDoorOpen,
//     FaDoorClosed,
//     FaCreditCard
// } from 'react-icons/fa';
// import reservationService from '../services/reservationService';
// import ReservationForm from '../components/reservations/ReservationForm';
// import PaymentForm from '../components/payments/PaymentForm';

// const ReservationsPage = () => {
//     const [reservations, setReservations] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [showForm, setShowForm] = useState(false);
//     const [showPaymentForm, setShowPaymentForm] = useState(false);
//     const [editingReservation, setEditingReservation] = useState(null);
//     const [selectedReservationForPayment, setSelectedReservationForPayment] = useState(null);
//     const [search, setSearch] = useState('');
//     const [filterStatus, setFilterStatus] = useState('');

//     useEffect(() => {
//         fetchReservations();
//     }, [filterStatus]);

//     const fetchReservations = async () => {
//         try {
//             setLoading(true);
//             const response = await reservationService.getReservations(1, 50, filterStatus);
//             setReservations(response.data || []);
//         } catch (error) {
//             toast.error('Failed to load reservations');
//             console.error('Error:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDelete = async (id) => {
//         if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
//         try {
//             await reservationService.cancelReservation(id);
//             toast.success('Reservation cancelled successfully');
//             fetchReservations();
//         } catch (error) {
//             toast.error('Failed to cancel reservation');
//         }
//     };

//     // ✅ FIXED: Check-In - NO CONFIRMATION DIALOG
//     const handleCheckIn = async (id) => {
//         console.log('🔄 Check-in clicked for reservation ID:', id);
        
//         try {
//             console.log('📤 Sending check-in request...');
//             const response = await reservationService.checkIn(id);
//             console.log('📥 Response:', response);
            
//             if (response && response.success) {
//                 toast.success('✅ Guest checked in successfully!');
//                 await fetchReservations();
//             } else {
//                 toast.error(response?.message || 'Failed to check in');
//             }
//         } catch (error) {
//             console.error('❌ Check-in error:', error);
//             toast.error(error.message || 'Failed to check in');
//         }
//     };

//     // ✅ FIXED: Check-Out - NO CONFIRMATION DIALOG
//     const handleCheckOut = async (id) => {
//         console.log('🔄 Check-out clicked for reservation ID:', id);
        
//         try {
//             console.log('📤 Sending check-out request...');
//             const response = await reservationService.checkOut(id);
//             console.log('📥 Response:', response);
            
//             if (response && response.success) {
//                 toast.success('✅ Guest checked out successfully!');
//                 await fetchReservations();
//             } else {
//                 toast.error(response?.message || 'Failed to check out');
//             }
//         } catch (error) {
//             console.error('❌ Check-out error:', error);
//             toast.error(error.message || 'Failed to check out');
//         }
//     };

//     const getStatusColor = (status) => {
//         const colors = {
//             pending: 'bg-yellow-100 text-yellow-800',
//             confirmed: 'bg-blue-100 text-blue-800',
//             checked_in: 'bg-green-100 text-green-800',
//             checked_out: 'bg-gray-100 text-gray-800',
//             cancelled: 'bg-red-100 text-red-800',
//             no_show: 'bg-red-100 text-red-800'
//         };
//         return colors[status] || 'bg-gray-100 text-gray-800';
//     };

//     const getStatusIcon = (status) => {
//         switch(status) {
//             case 'checked_in': return <FaDoorOpen className="text-green-500" />;
//             case 'checked_out': return <FaDoorClosed className="text-gray-500" />;
//             case 'cancelled': return <FaTimesCircle className="text-red-500" />;
//             case 'confirmed': return <FaCheckCircle className="text-blue-500" />;
//             default: return <FaCalendarCheck className="text-yellow-500" />;
//         }
//     };

//     // Filter reservations by search
//     const filteredReservations = reservations.filter(res => {
//         const matchSearch = 
//             `${res.first_name} ${res.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
//             res.room_number?.includes(search) ||
//             res.reservation_number?.toLowerCase().includes(search.toLowerCase());
//         return matchSearch;
//     });

//     return (
//         <div>
//             {/* Header */}
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//                 <div>
//                     <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
//                     <p className="text-gray-600 mt-1">Manage all guest reservations</p>
//                 </div>
//                 <button
//                     onClick={() => {
//                         setEditingReservation(null);
//                         setShowForm(true);
//                     }}
//                     className="mt-3 sm:mt-0 btn-primary flex items-center"
//                 >
//                     <FaPlus className="mr-2" />
//                     New Reservation
//                 </button>
//             </div>

//             {/* Filters */}
//             <div className="card mb-6">
//                 <div className="flex flex-col sm:flex-row gap-4">
//                     <div className="flex-1 relative">
//                         <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                             type="text"
//                             placeholder="Search by guest name, room, or reservation #..."
//                             value={search}
//                             onChange={(e) => setSearch(e.target.value)}
//                             className="input-field pl-10"
//                         />
//                     </div>
//                     <div className="sm:w-48">
//                         <select
//                             value={filterStatus}
//                             onChange={(e) => setFilterStatus(e.target.value)}
//                             className="input-field"
//                         >
//                             <option value="">All Status</option>
//                             <option value="pending">Pending</option>
//                             <option value="confirmed">Confirmed</option>
//                             <option value="checked_in">Checked In</option>
//                             <option value="checked_out">Checked Out</option>
//                             <option value="cancelled">Cancelled</option>
//                             <option value="no_show">No Show</option>
//                         </select>
//                     </div>
//                     <button onClick={fetchReservations} className="btn-secondary">
//                         Refresh
//                     </button>
//                 </div>
//             </div>

//             {/* Reservations List */}
//             {loading ? (
//                 <div className="text-center py-12">
//                     <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
//                     <p className="mt-3 text-gray-600">Loading reservations...</p>
//                 </div>
//             ) : filteredReservations.length === 0 ? (
//                 <div className="card text-center py-12">
//                     <FaCalendarCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//                     <p className="text-gray-500 text-lg">No reservations found</p>
//                     <p className="text-gray-400 text-sm">Create a new reservation</p>
//                 </div>
//             ) : (
//                 <div className="space-y-3">
//                     {filteredReservations.map((res) => (
//                         <div key={res.id} className="card hover:shadow-lg transition-shadow">
//                             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//                                 {/* Guest Info */}
//                                 <div className="flex items-start space-x-4">
//                                     <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
//                                         {res.first_name?.charAt(0)}{res.last_name?.charAt(0)}
//                                     </div>
//                                     <div>
//                                         <div className="flex items-center gap-2 flex-wrap">
//                                             <h3 className="font-semibold text-gray-900">
//                                                 {res.first_name} {res.last_name}
//                                             </h3>
//                                             <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(res.reservation_status)}`}>
//                                                 {getStatusIcon(res.reservation_status)}
//                                                 <span className="capitalize">{res.reservation_status?.replace('_', ' ') || 'Pending'}</span>
//                                             </span>
//                                         </div>
//                                         <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
//                                             <span className="flex items-center gap-1">
//                                                 <FaBed className="h-3 w-3" />
//                                                 Room {res.room_number}
//                                             </span>
//                                             <span>•</span>
//                                             <span className="flex items-center gap-1">
//                                                 <FaCalendarCheck className="h-3 w-3" />
//                                                 {res.check_in_date} → {res.check_out_date}
//                                             </span>
//                                             <span>•</span>
//                                             <span className="font-medium text-primary-600">
//                                                 ${res.total_amount || 0}
//                                             </span>
//                                             {res.balance > 0 && (
//                                                 <span className="text-xs text-red-500 font-medium">
//                                                     Balance: ${res.balance}
//                                                 </span>
//                                             )}
//                                         </div>
//                                         <p className="text-xs text-gray-400 mt-1">
//                                             #{res.reservation_number}
//                                         </p>
//                                     </div>
//                                 </div>

//                                 {/* Actions - NO CONFIRMATION DIALOGS */}
//                                 <div className="flex items-center gap-2 flex-wrap">
//                                     {/* Record Payment Button */}
//                                     {(res.reservation_status === 'checked_in' || res.reservation_status === 'confirmed') && res.balance > 0 && (
//                                         <button
//                                             onClick={() => {
//                                                 setSelectedReservationForPayment(res);
//                                                 setShowPaymentForm(true);
//                                             }}
//                                             className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-3 rounded-lg flex items-center gap-1 transition-colors"
//                                         >
//                                             <FaCreditCard className="h-3 w-3" />
//                                             Pay ${res.balance}
//                                         </button>
//                                     )}

//                                     {/* ✅ Check In Button - NO CONFIRMATION */}
//                                     {res.reservation_status === 'confirmed' && (
//                                         <button
//                                             onClick={() => handleCheckIn(res.id)}
//                                             className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded-lg flex items-center gap-1 transition-colors"
//                                         >
//                                             <FaDoorOpen className="h-3 w-3" />
//                                             Check In
//                                         </button>
//                                     )}

//                                     {/* ✅ Check Out Button - NO CONFIRMATION */}
//                                     {res.reservation_status === 'checked_in' && (
//                                         <button
//                                             onClick={() => handleCheckOut(res.id)}
//                                             className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-1 px-3 rounded-lg flex items-center gap-1 transition-colors"
//                                         >
//                                             <FaDoorClosed className="h-3 w-3" />
//                                             Check Out
//                                         </button>
//                                     )}

//                                     {/* Edit Button */}
//                                     {res.reservation_status !== 'checked_in' && 
//                                      res.reservation_status !== 'checked_out' && 
//                                      res.reservation_status !== 'cancelled' && (
//                                         <button
//                                             onClick={() => {
//                                                 setEditingReservation(res);
//                                                 setShowForm(true);
//                                             }}
//                                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                                             title="Edit"
//                                         >
//                                             <FaEdit />
//                                         </button>
//                                     )}

//                                     {/* Cancel Button */}
//                                     {res.reservation_status !== 'checked_in' && 
//                                      res.reservation_status !== 'checked_out' && (
//                                         <button
//                                             onClick={() => handleDelete(res.id)}
//                                             className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                                             title="Cancel"
//                                         >
//                                             <FaTrash />
//                                         </button>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}

//             {/* Reservation Form Modal */}
//             {showForm && (
//                 <ReservationForm
//                     reservation={editingReservation}
//                     onClose={() => {
//                         setShowForm(false);
//                         setEditingReservation(null);
//                     }}
//                     onSuccess={() => {
//                         setShowForm(false);
//                         setEditingReservation(null);
//                         fetchReservations();
//                     }}
//                 />
//             )}

//             {/* Payment Form Modal */}
//             {showPaymentForm && selectedReservationForPayment && (
//                 <PaymentForm
//                     reservationId={selectedReservationForPayment.id}
//                     guestId={selectedReservationForPayment.guest_id}
//                     onClose={() => {
//                         setShowPaymentForm(false);
//                         setSelectedReservationForPayment(null);
//                     }}
//                     onSuccess={() => {
//                         setShowPaymentForm(false);
//                         setSelectedReservationForPayment(null);
//                         fetchReservations();
//                         toast.success('Payment recorded successfully!');
//                     }}
//                 />
//             )}
//         </div>
//     );
// };

// export default ReservationsPage;