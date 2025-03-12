
import { useLocation, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import CustomerDetails from '@/pages/CustomerDetails';
import Consumables from '@/pages/Consumables';
import StockLevels from '@/pages/StockLevels';
import DailyReadings from '@/pages/DailyReadings';
import RecordIndent from '@/pages/FuelingProcess';
import StaffManagement from '@/pages/StaffManagement';
import ShiftManagement from '@/pages/ShiftManagement';
import TestingDetails from '@/pages/TestingDetails';
import FuelPumpSettings from '@/pages/FuelPumpSettings';
import NotFound from '@/pages/NotFound';

const App = () => {
  const location = useLocation();
  const isAuthPage = ["/", "/login"].includes(location.pathname);

  return (
    <>
      <AuthProvider>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Outlet />
                </DashboardLayout>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetails />} />
            <Route path="consumables" element={<Consumables />} />
            <Route path="stock-levels" element={<StockLevels />} />
            <Route path="daily-readings" element={<DailyReadings />} />
            <Route path="fueling-process" element={<RecordIndent />} />
            <Route path="staff-management" element={<StaffManagement />} />
            <Route path="shift-management" element={<ShiftManagement />} />
            <Route path="testing-details" element={<TestingDetails />} />
            <Route path="pump-settings" element={<FuelPumpSettings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>

      {!isAuthPage && <Toaster />}
    </>
  );
};

export default App;
