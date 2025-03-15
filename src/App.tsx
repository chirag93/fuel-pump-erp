
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Home from './Home'; // Import from the correct location
import Login from './pages/Login';
import DailyReadings from './pages/DailyReadings';
import StockLevels from './pages/StockLevels';
import AllTransactions from './pages/AllTransactions';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import StaffManagement from './pages/StaffManagement';
import RecordIndent from './pages/RecordIndent';
import ShiftManagement from './pages/ShiftManagement';
import Consumables from './pages/Consumables';
import TestingDetails from './pages/TestingDetails';
import FuelPumpSettings from './pages/FuelPumpSettings';
import TankUnload from './pages/TankUnload';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with sidebar layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/daily-readings" element={
            <ProtectedRoute>
              <DailyReadings />
            </ProtectedRoute>
          } />
          <Route path="/stock-levels" element={
            <ProtectedRoute>
              <StockLevels />
            </ProtectedRoute>
          } />
          <Route path="/all-transactions" element={
            <ProtectedRoute>
              <AllTransactions />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute>
              <CustomerDetails />
            </ProtectedRoute>
          } />
          <Route path="/staff-management" element={
            <ProtectedRoute>
              <StaffManagement />
            </ProtectedRoute>
          } />
          <Route path="/record-indent" element={
            <ProtectedRoute>
              <RecordIndent />
            </ProtectedRoute>
          } />
          <Route path="/shift-management" element={
            <ProtectedRoute>
              <ShiftManagement />
            </ProtectedRoute>
          } />
          <Route path="/consumables" element={
            <ProtectedRoute>
              <Consumables />
            </ProtectedRoute>
          } />
          <Route path="/testing-details" element={
            <ProtectedRoute>
              <TestingDetails />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <FuelPumpSettings />
            </ProtectedRoute>
          } />
          <Route path="/tank-unload" element={
            <ProtectedRoute>
              <TankUnload />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
