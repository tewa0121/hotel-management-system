import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';  // ✅ ADD THIS IMPORT

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Sidebar />
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="sm:ml-64 pt-16 flex-1">
                <div className="p-4 sm:p-6">
                    {children}
                </div>
            </main>
            
            {/* ✅ ADD FOOTER HERE */}
            <Footer />
        </div>
    );
};

export default Layout;