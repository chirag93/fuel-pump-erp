
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type StaffFeature = Database['public']['Enums']['staff_feature'];

interface AuthGuardProps {
  feature: StaffFeature;
  children: React.ReactNode;
}

export const AuthGuard = ({ feature, children }: AuthGuardProps) => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Super admins and regular admins always have access to all features
      if (isSuperAdmin || user.role === 'admin') {
        console.log('User is admin or super admin, granting access to feature:', feature);
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      try {
        // Check with the backend for permission
        const { data, error } = await supabase.rpc('has_feature_access', {
          p_auth_id: user.id,
          p_feature: feature
        });

        if (error) {
          console.error('Error checking feature access:', error);
          setHasAccess(false);
          navigate('/unauthorized');
        } else {
          console.log('Permission check for feature', feature, ':', data);
          // Ensure we set a boolean value to state
          setHasAccess(data === true);
        }
      } catch (error) {
        console.error('Error in permission check:', error);
        setHasAccess(false);
        navigate('/unauthorized');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user, feature, navigate, isSuperAdmin]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Checking permissions...</div>;
  }

  return hasAccess ? <>{children}</> : null;
};
