
import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const SuperAdminLayoutWrapper = () => {
  return (
    <SuperAdminLayout>
      <Outlet />
    </SuperAdminLayout>
  );
};

export default SuperAdminLayoutWrapper;
