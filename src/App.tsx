
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
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} /> {/* Now using the Home component */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/daily-readings" element={<DailyReadings />} />
            <Route path="/stock-levels" element={<StockLevels />} />
            <Route path="/all-transactions" element={<AllTransactions />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/staff-management" element={<StaffManagement />} />
            <Route path="/record-indent" element={<RecordIndent />} />
            <Route path="/shift-management" element={<ShiftManagement />} />
            <Route path="/consumables" element={<Consumables />} />
            <Route path="/testing-details" element={<TestingDetails />} />
            <Route path="/settings" element={<FuelPumpSettings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
