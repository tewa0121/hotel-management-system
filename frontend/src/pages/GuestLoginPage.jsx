import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEnvelope, FaLock, FaHotel } from 'react-icons/fa';

const GuestLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/guest/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('guestToken', data.token);
                localStorage.setItem('guest', JSON.stringify(data.guest));
                toast.success('Welcome back!');
                navigate('/guest/dashboard');
            } else {
                toast.error(data.message || 'Login failed');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="bg-primary-100 p-4 rounded-full">
                            <FaHotel className="h-12 w-12 text-primary-600" />
                        </div>
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">Guest Login</h2>
                    <p className="mt-1 text-sm text-gray-600">Access your reservations and invoices</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative mt-1">
                            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field pl-10"
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative mt-1">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-10"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full btn-primary flex items-center justify-center gap-2 ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Don't have an account?</p>
                    <p className="mt-1">Contact the hotel reception to register.</p>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm">
                        ← Staff Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default GuestLoginPage;