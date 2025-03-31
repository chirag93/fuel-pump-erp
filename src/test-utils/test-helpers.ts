
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React, { ReactElement } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SuperAdminAuthProvider } from '@/superadmin/contexts/SuperAdminAuthContext';

// Custom renderer that wraps components with necessary providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    route?: string;
    isAuthenticated?: boolean;
    isSuperAdmin?: boolean;
  }
) {
  const { 
    route = '/', 
    isAuthenticated = false,
    isSuperAdmin = false,
    ...renderOptions 
  } = options || {};

  // Mock the auth context values
  const authContextValue = {
    isAuthenticated,
    isLoading: false,
    user: isAuthenticated ? { id: 'test-user-id', email: 'test@example.com' } : null,
    login: jest.fn(),
    logout: jest.fn(),
    isSuperAdmin,
    fuelPumpName: 'Test Fuel Pump',
    fuelPumpId: 'test-pump-id'
  };

  const superAdminAuthValue = {
    isAuthenticated: isSuperAdmin,
    isLoading: false,
    user: isSuperAdmin ? { id: 'super-admin-id', email: 'admin@example.com' } : null,
    login: jest.fn(),
    logout: jest.fn()
  };

  // Set up history with the initial route
  window.history.pushState({}, 'Test page', route);

  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <AuthProvider overrideValue={authContextValue}>
          <SuperAdminAuthProvider overrideValue={superAdminAuthValue}>
            {children}
          </SuperAdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    ),
    ...renderOptions,
  });
}

// Mock the useIsMobile hook for mobile testing
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false)
}));

// Helper to toggle mobile mode for tests
export function setMobileMode(isMobile: boolean) {
  const useMobileMock = require('@/hooks/use-mobile');
  useMobileMock.useIsMobile.mockImplementation(() => isMobile);
}

// Helper to mock Supabase responses
export function mockSupabaseQuery(table: string, mockData: any, mockError: any = null) {
  const { supabase } = require('@/integrations/supabase/client');
  
  if (mockData) {
    (supabase.from as jest.Mock).mockImplementation((queryTable) => {
      if (queryTable === table) {
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnValue({
            data: mockData,
            error: mockError
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      };
    });
  }
}
