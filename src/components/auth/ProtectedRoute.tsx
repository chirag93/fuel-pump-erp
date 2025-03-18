
import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Shield, Fuel } from 'lucide-react';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, isSuperAdmin, user, fuelPumpName } = useAuth();
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
    console.log('User not authenticated, redirecting to login');
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
