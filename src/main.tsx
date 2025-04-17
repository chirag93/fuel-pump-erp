
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { SuperAdminAuthProvider } from './superadmin/contexts/SuperAdminAuthContext';
import { migrateLogoToSupabase } from './integrations/storage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Migrate logo to Supabase storage on development
if (import.meta.env.DEV) {
  migrateLogoToSupabase()
    .then(() => console.log('Logo migration attempted'))
    .catch(error => console.error('Error in logo migration:', error));
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
