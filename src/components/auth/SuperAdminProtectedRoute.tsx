
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const SuperAdminProtectedRoute = () => {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to super-admin login');
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
  }
  
  if (!isSuperAdmin) {
    console.log('User authenticated but not super admin, redirecting to super-admin login');
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
  }

  return (
    <SuperAdminLayout>
      <Outlet />
    </SuperAdminLayout>
  );
};

export default SuperAdminProtectedRoute;
