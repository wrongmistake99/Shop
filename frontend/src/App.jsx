import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/Inventory';
import SettingsPage from './pages/SettingsPage';
import RecordsPage from './pages/RecordsPage';
import TransactionsPage from './pages/TransactionsPage';
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Root → go to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/inventory" element={<Layout><InventoryPage /></Layout>} />
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
        <Route path="/records" element={<Layout><RecordsPage /></Layout>} />
        <Route path="/transactions" element={<Layout><TransactionsPage /></Layout>} />

        {/* Catch all unknown routes → back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;