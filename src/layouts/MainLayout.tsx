
import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

export const MainLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default MainLayout;
