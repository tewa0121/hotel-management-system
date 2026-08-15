import React from 'react';
import { 
    FaEnvelope, 
    FaGithub, 
    FaPhone, 
    FaMapMarkerAlt, 
    FaFacebook, 
    FaTwitter, 
    FaLinkedin,
    FaHeart,
    FaCode,
    FaHotel
} from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-12 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-primary-600 p-2 rounded-lg">
                                <FaHotel className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">Hotel HMS</span>
                                <p className="text-xs text-gray-400">Management System</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Complete Hotel Management System for modern hotels. 
                            Streamline operations, enhance guest experience, and 
                            maximize revenue with our comprehensive solution.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <a 
                                href="https://github.com/tewa0121" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                                aria-label="GitHub"
                            >
                                <FaGithub className="h-5 w-5 text-gray-400 hover:text-white" />
                            </a>
                            <a 
                                href="#" 
                                className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                                aria-label="Facebook"
                            >
                                <FaFacebook className="h-5 w-5 text-gray-400 hover:text-white" />
                            </a>
                            <a 
                                href="#" 
                                className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                                aria-label="Twitter"
                            >
                                <FaTwitter className="h-5 w-5 text-gray-400 hover:text-white" />
                            </a>
                            <a 
                                href="#" 
                                className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                                aria-label="LinkedIn"
                            >
                                <FaLinkedin className="h-5 w-5 text-gray-400 hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary-500 rounded"></span>
                            Contact Info
                        </h4>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li className="flex items-start gap-3 hover:text-white transition-colors group">
                                <FaEnvelope className="text-primary-400 h-4 w-4 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <a href="mailto:tewachewmelaku6@gmail.com" className="hover:text-primary-400">
                                        tewachewmelaku6@gmail.com
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 hover:text-white transition-colors group">
                                <FaPhone className="text-primary-400 h-4 w-4 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <a href="tel:+251920954224" className="hover:text-primary-400">
                                        +251 920 954 224
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 hover:text-white transition-colors group">
                                <FaGithub className="text-primary-400 h-4 w-4 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-gray-500">GitHub</p>
                                    <a href="https://github.com/tewa0121" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400">
                                        github.com/tewa0121
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 hover:text-white transition-colors group">
                                <FaMapMarkerAlt className="text-primary-400 h-4 w-4 mt-0.5 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-gray-500">Location</p>
                                    <span>Addis Ababa, Ethiopia</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary-500 rounded"></span>
                            Quick Links
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Dashboard
                                </a>
                            </li>
                            <li>
                                <a href="/guests" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Guests
                                </a>
                            </li>
                            <li>
                                <a href="/rooms" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Rooms
                                </a>
                            </li>
                            <li>
                                <a href="/reservations" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Reservations
                                </a>
                            </li>
                            <li>
                                <a href="/reports" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Reports
                                </a>
                            </li>
                            {/* ✅ Food Module Links */}
                            <li>
                                <a href="/food/menu" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Food Menu
                                </a>
                            </li>
                            <li>
                                <a href="/food/place-order" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Place Order
                                </a>
                            </li>
                            <li>
                                <a href="/food/orders" className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1 h-1 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    Food Orders
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Tech Stack & Developer */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary-500 rounded"></span>
                            Developer
                        </h4>
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                    TM
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Tewachew Melaku</p>
                                    <p className="text-xs text-gray-400">Full Stack Developer</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <a 
                                    href="https://github.com/tewa0121" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
                                >
                                    <FaGithub className="h-4 w-4" />
                                    <span>@tewa0121</span>
                                </a>
                                <a 
                                    href="mailto:tewachewmelaku6@gmail.com"
                                    className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
                                >
                                    <FaEnvelope className="h-4 w-4" />
                                    <span>tewachewmelaku6@gmail.com</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 mt-10 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                            &copy; {currentYear} 
                            <span className="text-primary-400 font-semibold mx-1">Hotel HMS</span>
                            All rights reserved.
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                            <span>Developed with</span>
                            <FaHeart className="text-red-500 animate-pulse h-3 w-3" />
                            <span>by</span>
                            <a 
                                href="https://github.com/tewa0121" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                            >
                                Tewachew Melaku
                            </a>
                            <span className="text-gray-600">|</span>
                            <span className="flex items-center gap-1">
                                <FaCode className="h-3 w-3 text-gray-500" />
                                v1.0.0
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;