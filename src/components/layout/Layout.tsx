
import React from 'react';
import DashboardLayout from './DashboardLayout';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        {children}
      </div>
    </DashboardLayout>
  );
};

export default Layout;
