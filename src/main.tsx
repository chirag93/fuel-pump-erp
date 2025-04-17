
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Toaster } from '@/components/ui/toaster';
import { migrateLogoToSupabase } from './integrations/storage';

// Migrate logo to Supabase storage on development
if (import.meta.env.DEV) {
  migrateLogoToSupabase()
    .then(() => console.log('Logo migration attempted'))
    .catch(error => console.error('Error in logo migration:', error));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>
);
