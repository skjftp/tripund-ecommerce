import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { initializeAuthRefresh } from './services/auth';
import './services/analytics'; // Initialize analytics tracking
import Layout from './components/layout/Layout';
import ScrollToTop from './components/common/ScrollToTop';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import OrdersPage from './pages/OrdersPage';
import OrderStatusPage from './pages/OrderStatusPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CategoriesPage from './pages/CategoriesPage';
import SearchPage from './pages/SearchPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import FAQPage from './pages/FAQPage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import TrackingRedirect from './pages/TrackingRedirect';
import MobileLoginPage from './pages/MobileLoginPage';
import MobileRegisterPage from './pages/MobileRegisterPage';
import AddressesPage from './pages/AddressesPage';
import AppInitializer from './components/AppInitializer';

function App() {
  useEffect(() => {
    // Initialize auth token refresh on app start
    initializeAuthRefresh();
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <AppInitializer>
          <ScrollToTop />
          <Toaster position="top-right" />
          <Layout>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/category/:category/:subcategory" element={<CategoryPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/mobile-login" element={<MobileLoginPage />} />
            <Route path="/mobile-register" element={<MobileRegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/track/:orderNumber" element={<TrackingRedirect />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-conditions" element={<TermsConditionsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/shipping" element={<ShippingPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
          </Routes>
        </Layout>
        </AppInitializer>
      </Router>
    </Provider>
  );
}

export default App;