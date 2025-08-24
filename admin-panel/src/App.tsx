import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { useState } from 'react';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import Promotions from './pages/Promotions';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ContentManagement from './pages/ContentManagement';
import Legal from './pages/Legal';
import ContactMessages from './pages/ContactMessages';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Products />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Orders />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Customers />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Categories />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/promotions"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Promotions />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Payments />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Analytics />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Notifications />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Settings />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/content"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <ContentManagement />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/legal"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <Legal />
                </AdminLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/contact-messages"
            element={
              <PrivateRoute>
                <AdminLayout>
                  <ContactMessages />
                </AdminLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App
