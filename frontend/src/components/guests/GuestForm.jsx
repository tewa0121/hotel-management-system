import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import guestService from '../../services/guestService';

// Validators
const isValidEthiopianPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^09\d{8}$/.test(cleaned);
};

const isGmailEmail = (email) => {
    if (!email) return false;
    return email.toLowerCase().endsWith('@gmail.com');
};

const GuestForm = ({ guest, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        id_type: 'passport',
        id_number: '',
        date_of_birth: '',
        gender: 'other',
        nationality: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
        password: '' // ✅ NEW: for guest login
    });

    useEffect(() => {
        if (guest) {
            setFormData({
                first_name: guest.first_name || '',
                last_name: guest.last_name || '',
                email: guest.email || '',
                phone: guest.phone || '',
                address: guest.address || '',
                city: guest.city || '',
                country: guest.country || '',
                id_type: guest.id_type || 'passport',
                id_number: guest.id_number || '',
                date_of_birth: guest.date_of_birth || '',
                gender: guest.gender || 'other',
                nationality: guest.nationality || '',
                emergency_contact_name: guest.emergency_contact_name || '',
                emergency_contact_phone: guest.emergency_contact_phone || '',
                notes: guest.notes || '',
                password: '' // never pre-fill password for security
            });
        }
    }, [guest]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Required fields
        if (!formData.first_name || !formData.last_name) {
            toast.error('First name and last name are required');
            return;
        }

        if (!formData.email) {
            toast.error('Email is required');
            return;
        }
        if (!isGmailEmail(formData.email)) {
            toast.error('Email must be a Gmail address (@gmail.com)');
            return;
        }

        if (!formData.phone) {
            toast.error('Phone number is required');
            return;
        }
        if (!isValidEthiopianPhone(formData.phone)) {
            toast.error('Phone must start with 09 and be 10 digits (e.g., 0912345678)');
            return;
        }

        // ✅ Password validation – only required when creating a new guest
        if (!guest && !formData.password) {
            toast.error('Password is required for new guests');
            return;
        }
        if (formData.password && formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // Prepare data – remove password if empty (for updates)
            const submitData = { ...formData };
            if (!submitData.password) {
                delete submitData.password;
            }

            if (guest) {
                await guestService.updateGuest(guest.id, submitData);
                toast.success('Guest updated successfully');
            } else {
                await guestService.createGuest(submitData);
                toast.success('Guest created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('❌ Error saving guest:', error);
            toast.error(error.message || 'Failed to save guest');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        {guest ? 'Edit Guest' : 'Add New Guest'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <FaTimes className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Personal Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="John"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Smith"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="john@gmail.com"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Must be a Gmail address (@gmail.com)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0912345678"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Must start with 09 (e.g., 0912345678)
                            </p>
                        </div>

                        {/* ✅ NEW: Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password {!guest && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field"
                                placeholder={guest ? 'Leave blank to keep current password' : 'Set a password for guest login'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {guest
                                    ? 'Leave empty to keep existing password'
                                    : 'Guest will use this to log in and view their reservations'}
                            </p>
                        </div>

                        {/* Address & Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="123 Main Street"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Addis Ababa"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Ethiopia"
                            />
                        </div>

                        {/* ID & Personal Details */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                            <select
                                name="id_type"
                                value={formData.id_type}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="passport">Passport</option>
                                <option value="national_id">National ID</option>
                                <option value="driver_license">Driver's License</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                            <input
                                type="text"
                                name="id_number"
                                value={formData.id_number}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="ID Number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                            <input
                                type="text"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Ethiopian"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                            <input
                                type="text"
                                name="emergency_contact_name"
                                value={formData.emergency_contact_name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Emergency Contact"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                            <input
                                type="text"
                                name="emergency_contact_phone"
                                value={formData.emergency_contact_phone}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0912345678"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                className="input-field"
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Saving...' : (guest ? 'Update Guest' : 'Create Guest')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GuestForm;