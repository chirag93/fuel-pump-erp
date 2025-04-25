
import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const SuperAdminLayoutWrapper = () => {
  // Make sure there's only one layout wrapper
  return (
    <SuperAdminLayout>
      <div className="container mx-auto py-6 px-4">
        <Outlet />
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminLayoutWrapper;
