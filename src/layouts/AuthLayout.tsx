
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
