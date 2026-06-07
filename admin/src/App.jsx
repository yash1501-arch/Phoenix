import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Adventures from './pages/Adventures';
import AddAdventure from './pages/AddAdventure';
import EditAdventure from './pages/EditAdventure';
import Bookings from './pages/Bookings';
import Users from './pages/Users';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import Reviews from './pages/Reviews';
import AuditLog from './pages/AuditLog';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-state" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #D4AF37',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#D4AF37', secondary: '#000' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/adventures" element={
            <ProtectedRoute>
              <Adventures />
            </ProtectedRoute>
          } />

          <Route path="/adventures/add" element={
            <ProtectedRoute>
              <AddAdventure />
            </ProtectedRoute>
          } />

          <Route path="/adventures/edit/:id" element={
            <ProtectedRoute>
              <EditAdventure />
            </ProtectedRoute>
          } />

          <Route path="/bookings" element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/reviews" element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          } />

          <Route path="/audit" element={
            <ProtectedRoute>
              <AuditLog />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
