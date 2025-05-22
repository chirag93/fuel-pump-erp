import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const SuperAdminLayoutWrapper = () => {
  // This component is not currently used, but we're keeping it
  // to avoid breaking any potential references to it
  return (
    <SuperAdminLayout>
      <Outlet />
    </SuperAdminLayout>
  );
};

export default SuperAdminLayoutWrapper;
