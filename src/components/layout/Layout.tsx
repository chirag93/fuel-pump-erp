
import React from 'react';
import DashboardLayout from './DashboardLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        {children}
      </div>
    </DashboardLayout>
  );
};

export default Layout;
