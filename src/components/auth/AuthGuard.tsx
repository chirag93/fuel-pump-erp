
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
  const { user } = useAuth();
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

      // Super admins and admins always have access to everything
      if (user.role === 'admin' || user.role === 'super_admin') {
        console.log('Admin/Super admin has access to', feature);
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // For staff, check if they have the specific permission
      try {
        // First fetch the staff record to get the staff_id
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (staffError || !staffData) {
          console.error('Error fetching staff record:', staffError);
          setHasAccess(false);
          setIsLoading(false);
          navigate('/unauthorized');
          return;
        }

        // Now check if this staff has the specific feature permission
        const { data, error } = await supabase
          .from('staff_permissions')
          .select('feature')
          .eq('staff_id', staffData.id)
          .eq('feature', feature)
          .maybeSingle();

        if (error) {
          console.error('Error checking permissions:', error);
          setHasAccess(false);
        } else {
          console.log('Permission check for feature', feature, ':', !!data);
          setHasAccess(!!data); // Set to true if data exists (permission found)
        }
      } catch (error) {
        console.error('Error in permission check:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
        if (!hasAccess) {
          navigate('/unauthorized');
        }
      }
    };

    checkAccess();
  }, [user, feature, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Checking permissions...</div>;
  }

  return hasAccess ? <>{children}</> : null;
};
