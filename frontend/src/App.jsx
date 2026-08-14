import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Page Imports
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GuestsPage from './pages/GuestsPage';
import RoomsPage from './pages/RoomsPage';
import ReservationsPage from './pages/ReservationsPage';
import PaymentsPage from './pages/PaymentsPage';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage'; // ✅ ADDED
import HousekeepingPage from './pages/HousekeepingPage';
import MaintenancePage from './pages/MaintenancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Layout Component
import Layout from './components/common/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/guests" element={
              <ProtectedRoute>
                <Layout>
                  <GuestsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/rooms" element={
              <ProtectedRoute>
                <Layout>
                  <RoomsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reservations" element={
              <ProtectedRoute>
                <Layout>
                  <ReservationsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/payments" element={
              <ProtectedRoute>
                <Layout>
                  <PaymentsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/invoices" element={
              <ProtectedRoute>
                <Layout>
                  <InvoicesPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/expenses" element={  // ✅ ADDED
              <ProtectedRoute>
                <Layout>
                  <ExpensesPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/housekeeping" element={
              <ProtectedRoute>
                <Layout>
                  <HousekeepingPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/maintenance" element={
              <ProtectedRoute>
                <Layout>
                  <MaintenancePage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <ReportsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Settings Route - Admin only */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;