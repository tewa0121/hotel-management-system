
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaEdit,
    FaTimes,
    FaSignInAlt,
    FaSignOutAlt,
    FaCalendarAlt,
    FaBed,
} from 'react-icons/fa';

import reservationService from '../services/reservationService';
import ReservationForm from '../components/reservations/ReservationForm';

const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    return error?.message || error?.error || 'Something went wrong';
};

const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

    return date.toLocaleDateString();
};

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const getGuestName = (reservation) => {
    const name = `${reservation.first_name || ''} ${reservation.last_name || ''}`.trim();
    return name || reservation.guest_name || `Guest #${reservation.guest_id || ''}`;
};

const statusClass = (status) => {
    const value = String(status || '').toLowerCase();

    if (value === 'confirmed') return 'bg-blue-100 text-blue-800';
    if (value === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (value === 'checked_in') return 'bg-green-100 text-green-800';
    if (value === 'checked_out') return 'bg-gray-100 text-gray-700';
    if (value === 'cancelled') return 'bg-red-100 text-red-800';
    if (value === 'no_show') return 'bg-orange-100 text-orange-800';

    return 'bg-gray-100 text-gray-700';
};

const ReservationsPage = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    });

    const [showForm, setShowForm] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);

    const fetchReservations = useCallback(async () => {
        setLoading(true);

        try {
            const response = await reservationService.getReservations(
                page,
                limit,
                statusFilter,
                dateFilter
            );

            const rows = Array.isArray(response.data) ? response.data : [];

            setReservations(rows);
            setPagination({
                page: Number(response.pagination?.page) || page,
                limit: Number(response.pagination?.limit) || limit,
                total: Number(response.pagination?.total) || rows.length,
                totalPages: Number(response.pagination?.totalPages) || 1,
            });
        } catch (error) {
            console.error('Failed to load reservations:', error);
            toast.error(getErrorMessage(error));
            setReservations([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit, statusFilter, dateFilter]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const openCreateForm = () => {
        setSelectedReservation(null);
        setShowForm(true);
    };

    const openEditForm = (reservation) => {
        setSelectedReservation(reservation);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setSelectedReservation(null);
    };

    const handleFormSuccess = async () => {
        closeForm();
        await fetchReservations();
    };

    const handleCancel = async (reservation) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel reservation #${reservation.id}?`
        );

        if (!confirmed) return;

        setActionLoading(reservation.id);

        try {
            await reservationService.cancelReservation(reservation.id);
            toast.success('Reservation cancelled successfully');
            await fetchReservations();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckIn = async (reservation) => {
        const confirmed = window.confirm(
            `Check in ${getGuestName(reservation)} for reservation #${reservation.id}?`
        );

        if (!confirmed) return;

        setActionLoading(reservation.id);

        try {
            await reservationService.checkIn(reservation.id);
            toast.success('Guest checked in successfully');
            await fetchReservations();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckOut = async (reservation) => {
        const confirmed = window.confirm(
            `Check out ${getGuestName(reservation)} for reservation #${reservation.id}?`
        );

        if (!confirmed) return;

        setActionLoading(reservation.id);

        try {
            await reservationService.checkOut(reservation.id);
            toast.success('Guest checked out successfully');
            await fetchReservations();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const filteredReservations = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) return reservations;

        return reservations.filter((reservation) => {
            const guestName = getGuestName(reservation).toLowerCase();
            const roomNumber = String(reservation.room_number || '').toLowerCase();
            const reservationId = String(reservation.id || '').toLowerCase();
            const email = String(reservation.email || '').toLowerCase();

            return (
                guestName.includes(value) ||
                roomNumber.includes(value) ||
                reservationId.includes(value) ||
                email.includes(value)
            );
        });
    }, [reservations, search]);

    const canEditOrCancel = (status) =>
        ['pending', 'confirmed'].includes(String(status || '').toLowerCase());

    const canCheckIn = (status) =>
        ['pending', 'confirmed'].includes(String(status || '').toLowerCase());

    const canCheckOut = (status) =>
        String(status || '').toLowerCase() === 'checked_in';

    const changeStatusFilter = (value) => {
        setPage(1);
        setStatusFilter(value);
    };

    const changeDateFilter = (value) => {
        setPage(1);
        setDateFilter(value);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Page heading */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage guest bookings, room assignments, check-ins, and check-outs.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={fetchReservations}
                        disabled={loading}
                        className="btn-secondary flex items-center justify-center gap-2"
                    >
                        <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="btn-primary flex items-center justify-center gap-2"
                    >
                        <FaPlus />
                        New Reservation
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search guest, room, or reservation..."
                        className="input-field pl-10"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(event) => changeStatusFilter(event.target.value)}
                    className="input-field"
                >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked in</option>
                    <option value="checked_out">Checked out</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No show</option>
                </select>

                <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => changeDateFilter(event.target.value)}
                    className="input-field"
                    title="Filter by reservation date"
                />
            </div>

            {/* Reservation table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        Loading reservations...
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="p-12 text-center">
                        <FaCalendarAlt className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <h3 className="font-semibold text-gray-700">No reservations found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Try changing your filters or create a new reservation.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                            Reservation
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                            Guest
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                            Room
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                            Stay
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {filteredReservations.map((reservation) => {
                                        const status = String(reservation.status || '').toLowerCase();
                                        const busy = actionLoading === reservation.id;

                                        return (
                                            <tr key={reservation.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-4 py-4">
                                                    <span className="font-semibold text-gray-900">
                                                        #{reservation.id}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-gray-500">
                                                        {reservation.source || 'direct'}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span className="font-medium text-gray-900">
                                                        {getGuestName(reservation)}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-gray-500">
                                                        {reservation.email || '-'}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4">
                                                    <span className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaBed className="text-gray-400" />
                                                        {reservation.room_number || reservation.room_id || '-'}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-gray-500">
                                                        {reservation.room_type_name || ''}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                                                    <span className="block">{formatDate(reservation.check_in_date)}</span>
                                                    <span className="block text-xs text-gray-400">
                                                        to {formatDate(reservation.check_out_date)}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                                                    ${formatCurrency(reservation.total_amount)}
                                                    <span className="mt-1 block text-xs font-normal text-gray-500">
                                                        Paid: ${formatCurrency(reservation.deposit_paid)}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>
                                                        {status.replace('_', ' ') || 'Unknown'}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        {canEditOrCancel(status) && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    title="Edit reservation"
                                                                    onClick={() => openEditForm(reservation)}
                                                                    disabled={busy}
                                                                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                                                >
                                                                    <FaEdit />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    title="Cancel reservation"
                                                                    onClick={() => handleCancel(reservation)}
                                                                    disabled={busy}
                                                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                                >
                                                                    <FaTimes />
                                                                </button>
                                                            </>
                                                        )}

                                                        {canCheckIn(status) && (
                                                            <button
                                                                type="button"
                                                                title="Check in"
                                                                onClick={() => handleCheckIn(reservation)}
                                                                disabled={busy}
                                                                className="rounded-lg p-2 text-green-700 hover:bg-green-50 disabled:opacity-50"
                                                            >
                                                                <FaSignInAlt />
                                                            </button>
                                                        )}

                                                        {canCheckOut(status) && (
                                                            <button
                                                                type="button"
                                                                title="Check out"
                                                                onClick={() => handleCheckOut(reservation)}
                                                                disabled={busy}
                                                                className="rounded-lg p-2 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                                                            >
                                                                <FaSignOutAlt />
                                                            </button>
                                                        )}

                                                        {busy && (
                                                            <span className="self-center text-xs text-gray-500">
                                                                Working...
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
                            <p className="text-sm text-gray-500">
                                Showing {filteredReservations.length} of {pagination.total} reservation(s)
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page <= 1 || loading}
                                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {page} of {pagination.totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                                    disabled={page >= pagination.totalPages || loading}
                                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create / edit modal */}
            {showForm && (
                <ReservationForm
                    reservation={selectedReservation}
                    onClose={closeForm}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default ReservationsPage;
