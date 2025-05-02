
import React from 'react';
import DashboardLayout from './DashboardLayout';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  
  // For home route, render children directly without sidebar
  if (location.pathname === '/') {
    return <>{children}</>;
  }
  
  // For other routes, use the DashboardLayout with sidebar
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

export default Layout;
