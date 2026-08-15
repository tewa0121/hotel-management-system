import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Sidebar - fixed on desktop, sliding on mobile */}
            <Sidebar />
            
            {/* Navbar - fixed at top */}
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            {/* Main content area */}
            <main className="flex-1 sm:ml-64 pt-16 flex flex-col">
                <div className="flex-1 p-4 sm:p-6">
                    {children}
                </div>
                
                {/* Footer - at bottom of main content */}
                <Footer />
            </main>
        </div>
    );
};

export default Layout;