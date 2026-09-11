import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Adventures from './pages/Adventures';
import AddAdventure from './pages/AddAdventure';
import AddTrekAdventure from './pages/AddTrekAdventure';
import AddTourAdventure from './pages/AddTourAdventure';
import EditAdventure from './pages/EditAdventure';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import Reviews from './pages/Reviews';
import BlogList from './pages/BlogList';
import BlogEditor from './pages/BlogEditor';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import Newsletter from './pages/Newsletter';
import AuditLog from './pages/AuditLog';
import Users from './pages/Users';
import Security from './pages/Security';
import Layout from './components/Layout';

const isStaffRole = (role) => role === 'admin' || role === 'clerk';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-state" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaffRole(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AdminOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--forest)',
              color: '#faf7f1',
              border: '1px solid rgba(250,247,241,0.15)',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '8px',
              padding: '10px 14px',
            },
            success: { iconTheme: { primary: '#faf7f1', secondary: '#2f4a3d' } },
            error: { iconTheme: { primary: '#fecaca', secondary: '#7f1d1d' } },
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
              <AdminOnlyRoute>
                <AddAdventure />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/adventures/new/trek" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <AddTrekAdventure />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/adventures/new/tour" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <AddTourAdventure />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/adventures/edit/:id" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <EditAdventure />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Settings />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/security" element={
            <ProtectedRoute>
              <Security />
            </ProtectedRoute>
          } />

          <Route path="/reviews" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Reviews />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/blog" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <BlogList />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/blog/new" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <BlogEditor />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/blog/edit/:id" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <BlogEditor />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Messages />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } />

          <Route path="/newsletter" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Newsletter />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/audit" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <AuditLog />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Users />
              </AdminOnlyRoute>
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
