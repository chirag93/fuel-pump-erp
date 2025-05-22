
import { Route, Routes } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Home from './Home';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProvisionPump from './pages/ProvisionPump';
import FuelPumpsPage from './pages/FuelPumpsPage';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminSettings from './pages/SuperAdminSettings';
import SuperAdminAnalytics from './pages/SuperAdminAnalytics';
import SuperAdminFuelPumps from './superadmin/pages/SuperAdminFuelPumps';
import { AuthGuard } from './components/auth/AuthGuard';
// Import as default
import SuperAdminProtectedRoute from './components/auth/SuperAdminProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      
      {/* Auth routes */}
      <Route element={<AuthLayout><Outlet /></AuthLayout>}>
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
      
      {/* Main app routes - protected by auth */}
      <Route element={
        <AuthGuard feature="dashboard">
          <MainLayout>
            <Outlet />
          </MainLayout>
        </AuthGuard>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add other protected routes here */}
      </Route>
      
      {/* Super Admin routes */}
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      <Route element={<SuperAdminProtectedRoute />}>
        <Route element={<SuperAdminLayout><Outlet /></SuperAdminLayout>}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/provision" element={<ProvisionPump />} />
          <Route path="/super-admin/fuel-pumps" element={<SuperAdminFuelPumps />} />
          <Route path="/super-admin/analytics" element={<SuperAdminAnalytics />} />
          <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
        </Route>
      </Route>
      
      {/* Catch-all route - display 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
