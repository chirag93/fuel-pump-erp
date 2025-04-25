
import React from 'react';
import DashboardLayout from './DashboardLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  // Removing the container div that might be causing duplicate sidebars
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

export default Layout;
