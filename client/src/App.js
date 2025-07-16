import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import SellArea from './pages/SellArea';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoutes';
import BuyArea from './pages/BuyArea';
import CartArea from './pages/CartArea';
import Profile from './pages/Profile';
import ViewProfile from './pages/ViewProfile';
import InventoryPage from './pages/InventoryPage';
import Chatbox from './components/Chatbox';
import './App.css';
import { AuthProvider } from './components/AuthProvider';
import AdminRoutes from './routes/adminRoutes';
import AdminDashboard from './admin/adminDashboard';
import ManageUsers from './admin/manageUsers';
import SecurityMonitor from './admin/SecurityMonitor';
import AuditLogViewer from './admin/AuditLogViewer';

import OrderStatus from './pages/OrderStatus';
import SellerOrders from './pages/SellerOrdersArea';
import WithdrawalPage from './pages/WithdrawalPage';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import axios from 'axios';

const App = () => {
  const loggedInUserId = localStorage.getItem('userId') || 'default-user-id';

  const fetchInventory = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/inventory', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log("Inventory fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  return (
    <AuthProvider>
      <Router>
        <div>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<HomePage />} />
            <Route
              path="/sell-area"
              element={
                <ProtectedRoute>
                  <SellArea />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/buy-area"
              element={
                <ProtectedRoute>
                  <BuyArea />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartArea />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view-profile/:userId"
              element={
                <ProtectedRoute>
                  <ViewProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoutes>
                  <AdminDashboard />
                </AdminRoutes>
              }
            />
            <Route
              path="/security-monitor"
              element={
                <AdminRoutes>
                  <SecurityMonitor />
                </AdminRoutes>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <AdminRoutes>
                  <AuditLogViewer />
                </AdminRoutes>
              }
            />
            <Route
              path="/pending"
              element={
                <ProtectedRoute>
                  <OrderStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/successful"
              element={
                <ProtectedRoute>
                  <OrderStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cancelled" 
              element={
                <ProtectedRoute>
                  <OrderStatus />
                </ProtectedRoute>
              }
            />
            <Route path="/seller-orders" element={<SellerOrders />} />
            <Route
              path="/withdraw"
              element={
                <ProtectedRoute>
                  <WithdrawalPage />
                </ProtectedRoute>
              }
            />
          </Routes>

          <Chatbox senderId={loggedInUserId} />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;