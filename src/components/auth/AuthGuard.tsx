
import { useEffect } from 'react';
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

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('staff_permissions')
        .select('feature')
        .eq('staff_id', user.id)
        .eq('feature', feature)
        .maybeSingle();

      if (error || !data) {
        navigate('/unauthorized');
      }
    };

    checkAccess();
  }, [user, feature, navigate]);

  return <>{children}</>;
};
