
import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Home from './Home'; 
import Login from './pages/Login';
import DailySalesRecord from './pages/DailySalesRecord';
import StockLevels from './pages/StockLevels';
import AllTransactions from './pages/AllTransactions';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import StaffManagement from './pages/StaffManagement';
import RecordIndent from './pages/RecordIndent';
import ShiftManagement from './pages/ShiftManagement';
import Consumables from './pages/Consumables';
import FuelPumpSettings from './pages/FuelPumpSettings';
import TankUnload from './pages/TankUnload';
import BookletIndents from './pages/BookletIndents';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import Accounting Pages
import FinancialReports from './pages/accounting/FinancialReports';
import TaxCalculation from './pages/accounting/TaxCalculation';
import ExportData from './pages/accounting/ExportData';
import InvoiceProcessing from './pages/accounting/InvoiceProcessing';
import Reconciliation from './pages/accounting/Reconciliation';
import ExpenseCategories from './pages/accounting/ExpenseCategories';

// Import Super Admin components
import SuperAdminProtectedRoute from './components/auth/SuperAdminProtectedRoute';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProvisionPump from './pages/ProvisionPump';
import FuelPumpsPage from './pages/FuelPumpsPage';
import SuperAdminAnalytics from './pages/SuperAdminAnalytics';
import SuperAdminSettings from './pages/SuperAdminSettings';

// Define props interface for ProtectedRoute
interface ProtectedRouteProps {
  children: ReactNode;
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Super Admin Routes */}
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route element={<SuperAdminProtectedRoute />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/provision" element={<ProvisionPump />} />
            <Route path="/super-admin/pumps" element={<FuelPumpsPage />} />
            <Route path="/super-admin/analytics" element={<SuperAdminAnalytics />} />
            <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
          </Route>
          
          {/* Protected routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/daily-readings" element={<DailySalesRecord />} />
            <Route path="/stock-levels" element={<StockLevels />} />
            <Route path="/all-transactions" element={<AllTransactions />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/customers/:customerId/booklets/:bookletId/indents" element={<BookletIndents />} />
            <Route path="/staff-management" element={<StaffManagement />} />
            <Route path="/record-indent" element={<RecordIndent />} />
            <Route path="/shift-management" element={<ShiftManagement />} />
            <Route path="/consumables" element={<Consumables />} />
            <Route path="/settings" element={<FuelPumpSettings />} />
            <Route path="/tank-unload" element={<TankUnload />} />
            
            {/* Accounting Routes */}
            <Route path="/accounting/financial-reports" element={<FinancialReports />} />
            <Route path="/accounting/tax-calculation" element={<TaxCalculation />} />
            <Route path="/accounting/export-data" element={<ExportData />} />
            <Route path="/accounting/invoice-processing" element={<InvoiceProcessing />} />
            <Route path="/accounting/reconciliation" element={<Reconciliation />} />
            <Route path="/accounting/expense-categories" element={<ExpenseCategories />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
