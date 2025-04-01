
import React from 'react';
import { Outlet } from 'react-router-dom';

export const Shell = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Shell;
