
import React, { ReactNode, useEffect, useState } from 'react';
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
import MobileHome from './pages/mobile/MobileHome';
import MobileRecordIndent from './pages/mobile/MobileRecordIndent';
import MobileCustomers from './pages/mobile/MobileCustomers';
import MobileShiftManagement from './pages/mobile/MobileShiftManagement';
import { useIsMobile } from './hooks/use-mobile';

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
  // Add state for determining if the component has mounted
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <AuthProvider>
      <Router>
        {mounted && (
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
            
            {/* Protected routes with layout detection for mobile/desktop */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<ConditionalHome />} />
              <Route path="/dashboard" element={<ConditionalRoute desktop={<Dashboard />} />} />
              <Route path="/daily-readings" element={<ConditionalRoute desktop={<DailySalesRecord />} />} />
              <Route path="/stock-levels" element={<ConditionalRoute desktop={<StockLevels />} />} />
              <Route path="/all-transactions" element={<ConditionalRoute desktop={<AllTransactions />} />} />
              <Route path="/customers" element={<ConditionalRoute desktop={<Customers />} mobile={<MobileCustomers />} />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              <Route path="/customers/:customerId/booklets/:bookletId/indents" element={<BookletIndents />} />
              <Route path="/staff-management" element={<ConditionalRoute desktop={<StaffManagement />} />} />
              <Route path="/record-indent" element={<ConditionalRoute desktop={<RecordIndent />} mobile={<MobileRecordIndent />} />} />
              <Route path="/shift-management" element={<ConditionalRoute desktop={<ShiftManagement />} mobile={<MobileShiftManagement />} />} />
              <Route path="/consumables" element={<ConditionalRoute desktop={<Consumables />} />} />
              <Route path="/settings" element={<ConditionalRoute desktop={<FuelPumpSettings />} />} />
              <Route path="/tank-unload" element={<ConditionalRoute desktop={<TankUnload />} />} />
              
              {/* Accounting Routes */}
              <Route path="/accounting/financial-reports" element={<ConditionalRoute desktop={<FinancialReports />} />} />
              <Route path="/accounting/tax-calculation" element={<ConditionalRoute desktop={<TaxCalculation />} />} />
              <Route path="/accounting/export-data" element={<ConditionalRoute desktop={<ExportData />} />} />
              <Route path="/accounting/invoice-processing" element={<ConditionalRoute desktop={<InvoiceProcessing />} />} />
              <Route path="/accounting/reconciliation" element={<ConditionalRoute desktop={<Reconciliation />} />} />
              <Route path="/accounting/expense-categories" element={<ConditionalRoute desktop={<ExpenseCategories />} />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Router>
    </AuthProvider>
  );
};

// Conditional Home component that renders either the mobile or desktop home
const ConditionalHome = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileHome />;
  } else {
    return <Home />;
  }
};

// A component that conditionally renders mobile or desktop versions
interface ConditionalRouteProps {
  desktop: React.ReactNode;
  mobile?: React.ReactNode;
}

const ConditionalRoute = ({ desktop, mobile }: ConditionalRouteProps) => {
  const isMobile = useIsMobile();
  
  if (isMobile && mobile) {
    return <>{mobile}</>;
  } else {
    return <>{desktop}</>;
  }
};

export default App;
