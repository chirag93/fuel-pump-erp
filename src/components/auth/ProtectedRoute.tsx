
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Shield, Fuel, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute = ({
  children
}: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    isLoading,
    isSuperAdmin,
    user,
    fuelPumpName,
    logout
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check if user has mobile-only access and redirect appropriately
  useEffect(() => {
    const checkMobileAccess = async () => {
      if (isAuthenticated && !isMobile && !location.pathname.includes('/mobile')) {
        try {
          // Get current user data including metadata
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user?.user_metadata?.mobile_only_access === true) {
            // Show error toast
            toast({
              title: "Access Restricted",
              description: "You do not have permission to login to the web app. Please contact your administrator.",
              variant: "destructive"
            });
            
            // Logout the user
            logout();
            
            // Redirect to login
            navigate('/login');
          }
        } catch (error) {
          console.error("Error checking mobile access:", error);
        }
      }
    };

    if (isAuthenticated && !isLoading) {
      checkMobileAccess();
    }
  }, [isAuthenticated, isLoading, isMobile, location.pathname, navigate, logout]);

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
              
              
            </div>
          </div>}
        
        {children || <Outlet />}
      </div>
    </DashboardLayout>;
};

export default ProtectedRoute;
