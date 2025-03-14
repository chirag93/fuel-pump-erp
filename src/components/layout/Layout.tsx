
import React from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container mx-auto py-6 px-4">
      {children}
    </div>
  );
};

export default Layout;
