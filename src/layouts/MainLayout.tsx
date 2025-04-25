
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Layout>
      {children || <Outlet />}
    </Layout>
  );
};

export default MainLayout;
