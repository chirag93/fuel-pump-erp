
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type StaffFeature = Database['public']['Enums']['staff_feature'];

interface FeatureGuardProps {
  feature: StaffFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component that guards access to content based on user permissions
 * for a specific feature.
 */
export const FeatureGuard = ({
  feature,
  children,
  fallback,
  redirectTo = '/unauthorized'
}: FeatureGuardProps) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { canAccess, isLoading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  
  const isLoading = authLoading || permissionsLoading;
  
  useEffect(() => {
    // Only check permissions when authentication and permissions are loaded
    if (!isLoading) {
      // First check if user is authenticated
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      
      // Then check if they have access to the feature
      if (!canAccess(feature) && !fallback) {
        navigate(redirectTo);
      }
    }
  }, [isAuthenticated, canAccess, feature, isLoading, navigate, redirectTo, fallback]);
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Checking permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  if (!canAccess(feature)) {
    return fallback ? <>{fallback}</> : null; // Will redirect in useEffect if no fallback
  }
  
  return <>{children}</>;
};

export default FeatureGuard;
