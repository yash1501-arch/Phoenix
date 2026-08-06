import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Adventures from './pages/Adventures';
import AddAdventure from './pages/AddAdventure';
import EditAdventure from './pages/EditAdventure';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import Reviews from './pages/Reviews';
import BlogList from './pages/BlogList';
import BlogEditor from './pages/BlogEditor';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
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

          <Route path="/blog" element={
            <ProtectedRoute>
              <BlogList />
            </ProtectedRoute>
          } />

          <Route path="/blog/new" element={
            <ProtectedRoute>
              <BlogEditor />
            </ProtectedRoute>
          } />

          <Route path="/blog/edit/:id" element={
            <ProtectedRoute>
              <BlogEditor />
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
