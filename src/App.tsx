
import React from 'react';
import AppRoutes from './routes';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
