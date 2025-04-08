
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Shield, Fuel, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    isLoading,
    isSuperAdmin,
    user,
    fuelPumpName
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Redirect to mobile interface on mobile devices
  useEffect(() => {
    if (isMobile && isAuthenticated && !location.pathname.includes('/mobile')) {
      navigate('/mobile');
    }
  }, [isMobile, isAuthenticated, location.pathname, navigate]);
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{
      from: location
    }} replace />;
  }

  // Automatically redirect to mobile view if on a mobile device
  if (isMobile && !location.pathname.includes('/mobile')) {
    return <Navigate to="/mobile" replace />;
  }
  
  return <DashboardLayout>
      <div className="container py-6">
        {isSuperAdmin && <div className="mb-6 p-3 bg-muted rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">Super Admin Access Available</span>
            </div>
            <Link to="/super-admin/dashboard">
              <Button variant="outline" size="sm">Go to Super Admin</Button>
            </Link>
          </div>}
        
        {fuelPumpName && !isMobile && <div className="mb-4">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              <span className="font-medium text-lg">{fuelPumpName}</span>
            </div>
          </div>}
        
        {children || <Outlet />}
      </div>
    </DashboardLayout>;
};

export default ProtectedRoute;
