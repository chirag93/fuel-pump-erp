
import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useSuperAdminAuth } from '@/superadmin/contexts/SuperAdminAuthContext';

export const SuperAdminRequired = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useSuperAdminAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/super-admin/login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
};

export default SuperAdminRequired;
