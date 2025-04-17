
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { SuperAdminAuthProvider } from './superadmin/contexts/SuperAdminAuthContext';
import { migrateLogoToSupabase, uploadDefaultLogo } from './integrations/storage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Migrate logo to Supabase storage on application load
if (import.meta.env.DEV || import.meta.env.PROD) {
  // For both development and production
  uploadDefaultLogo()
    .then(() => console.log('Logo upload check completed'))
    .catch(error => console.error('Error checking logo upload:', error));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SuperAdminAuthProvider>
            <App />
            <Toaster />
          </SuperAdminAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
