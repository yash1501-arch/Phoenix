import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import ScrollProgress from './components/ui/ScrollProgress';
import CookieConsent from './components/ui/CookieConsent';
import BackToTop from './components/ui/BackToTop';
import MobileTabBar from './components/ui/MobileTabBar';
import PageTransition from './components/ui/PageTransition';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import Profile from './pages/Profile';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import About from './pages/About';
import Blog from './pages/Blog';
import AdventuresPage from './pages/AdventuresPage';
import AdventureDetail from './pages/AdventureDetail';
import Cart from './pages/Cart';
import Treks from './pages/Treks';
import Camping from './pages/Camping';
import Safety from './pages/Safety';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import FAQ from './pages/FAQ';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Wishlist from './pages/Wishlist';
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <ScrollProgress />
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
        <CookieConsent />
        <BackToTop />
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <PageTransition>
                <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/adventures" element={<AdventuresPage />} />
                <Route path="/adventure/:id" element={<AdventureDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/treks" element={<Treks />} />
                <Route path="/camping" element={<Camping />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
                </PageTransition>
                <MobileTabBar />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
