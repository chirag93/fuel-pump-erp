
import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Shield, Fuel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, isSuperAdmin, user } = useAuth();
  const location = useLocation();
  const [fuelPumpName, setFuelPumpName] = useState<string | null>(null);
  const [loadingPump, setLoadingPump] = useState(true);

  useEffect(() => {
    const fetchFuelPumpInfo = async () => {
      if (!isAuthenticated || !user?.id) {
        setLoadingPump(false);
        return;
      }

      try {
        // Check if the user is associated with a fuel pump as an admin
        const { data, error } = await supabase
          .from('fuel_pumps')
          .select('name')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error fetching fuel pump info:', error);
          setFuelPumpName(null);
        } else if (data) {
          setFuelPumpName(data.name);
        }
      } catch (error) {
        console.error('Error in fetchFuelPumpInfo:', error);
      } finally {
        setLoadingPump(false);
      }
    };

    fetchFuelPumpInfo();
  }, [isAuthenticated, user?.id, user?.email]);

  if (isLoading || loadingPump) {
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <DashboardLayout>
      {isSuperAdmin && (
        <div className="mb-6 p-3 bg-muted rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">Super Admin Access Available</span>
          </div>
          <Link to="/super-admin/dashboard">
            <Button variant="outline" size="sm">Go to Super Admin</Button>
          </Link>
        </div>
      )}
      
      {fuelPumpName && (
        <div className="mb-6 p-3 bg-muted rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            <span className="font-medium">
              You are logged into: <span className="text-primary">{fuelPumpName}</span> ERP System
            </span>
          </div>
        </div>
      )}
      
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
