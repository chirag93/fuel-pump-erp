
import React, { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Layout>
      {children}
    </Layout>
  );
};

export default MainLayout;
