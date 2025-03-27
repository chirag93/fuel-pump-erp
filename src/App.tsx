
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Auth components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SuperAdminProtectedRoute from '@/components/auth/SuperAdminProtectedRoute';

// Pages
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import CustomerDetails from '@/pages/CustomerDetails';
import RecordIndent from '@/pages/RecordIndent';
import AllTransactions from '@/pages/AllTransactions';
import ShiftManagement from '@/pages/ShiftManagement';
import DailyReadings from '@/pages/DailyReadings';
import StaffManagement from '@/pages/StaffManagement';
import BookletIndents from '@/pages/BookletIndents';
import StockLevels from '@/pages/StockLevels';
import TankUnload from '@/pages/TankUnload';
import Consumables from '@/pages/Consumables';
import ApproveMobileOperations from '@/pages/ApproveMobileOperations';
import ApprovalRequests from '@/pages/ApprovalRequests';
import UserProfile from '@/pages/UserProfile';

// Settings
import FuelPumpSettings from '@/pages/FuelPumpSettings';

// Accounting
import FinancialReports from '@/pages/accounting/FinancialReports';
import Reconciliation from '@/pages/accounting/Reconciliation';
import InvoiceProcessing from '@/pages/accounting/InvoiceProcessing';
import TaxCalculation from '@/pages/accounting/TaxCalculation';
import ExportData from '@/pages/accounting/ExportData';
import ExpenseCategories from '@/pages/accounting/ExpenseCategories';

// Mobile Pages
import MobileHome from '@/pages/mobile/MobileHome';
import MobileCustomers from '@/pages/mobile/MobileCustomers';
import MobileShiftManagement from '@/pages/mobile/MobileShiftManagement';
import MobileRecordIndent from '@/pages/mobile/MobileRecordIndent';
import MobileDailyReadings from '@/pages/mobile/MobileDailyReadings';

// Other pages
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Index from '@/pages/Index';

// Super Admin Pages
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import SuperAdminLogin from '@/pages/SuperAdminLogin';
import SuperAdminSettings from '@/pages/SuperAdminSettings';
import SuperAdminAnalytics from '@/pages/SuperAdminAnalytics';
import FuelPumpsPage from '@/pages/FuelPumpsPage';
import ProvisionPump from '@/pages/ProvisionPump';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/record-indent" element={<RecordIndent />} />
        <Route path="/all-transactions" element={<AllTransactions />} />
        <Route path="/shift-management" element={<ShiftManagement />} />
        <Route path="/daily-readings" element={<DailyReadings />} />
        <Route path="/staff-management" element={<StaffManagement />} />
        <Route path="/booklet-indents/:id" element={<BookletIndents />} />
        <Route path="/stock-levels" element={<StockLevels />} />
        <Route path="/tank-unload" element={<TankUnload />} />
        <Route path="/consumables" element={<Consumables />} />
        <Route path="/profile" element={<UserProfile />} />
        
        {/* Approval Routes - Desktop only */}
        <Route path="/mobile-approvals" element={<ApproveMobileOperations />} />
        <Route path="/approval-requests" element={<ApprovalRequests />} />
        
        {/* Settings Routes */}
        <Route path="/settings" element={<FuelPumpSettings />} />
        
        {/* Accounting Routes */}
        <Route path="/accounting" element={<FinancialReports />} />
        <Route path="/accounting/reconciliation" element={<Reconciliation />} />
        <Route path="/accounting/invoices" element={<InvoiceProcessing />} />
        <Route path="/accounting/tax" element={<TaxCalculation />} />
        <Route path="/accounting/export" element={<ExportData />} />
        <Route path="/accounting/expense-categories" element={<ExpenseCategories />} />
      </Route>
      
      {/* Super Admin Routes */}
      <Route element={<SuperAdminProtectedRoute />}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
        <Route path="/super-admin/analytics" element={<SuperAdminAnalytics />} />
        <Route path="/super-admin/fuel-pumps" element={<FuelPumpsPage />} />
        <Route path="/super-admin/pumps" element={<FuelPumpsPage />} />
        <Route path="/super-admin/provision" element={<ProvisionPump />} />
      </Route>
      
      {/* Mobile Routes - Not protected to allow direct access */}
      <Route path="/mobile" element={<MobileHome />} />
      <Route path="/mobile/customers" element={<MobileCustomers />} />
      <Route path="/mobile/shift-management" element={<MobileShiftManagement />} />
      <Route path="/mobile/daily-readings" element={<MobileDailyReadings />} />
      <Route path="/mobile/record-indent" element={<MobileRecordIndent />} />
      
      {/* Customer Details route should be accessible on mobile too */}
      <Route path="/customers/:id" element={<CustomerDetails />} />
      
      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
