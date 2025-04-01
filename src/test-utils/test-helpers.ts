
import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { createMemoryHistory } from 'history';

// Mock session data for testing
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'manager'
  },
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token'
};

// Create a special render function that includes providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: {
    isAuthenticated?: boolean;
    isSuperAdmin?: boolean;
    initialEntries?: string[];
    renderOptions?: Omit<RenderOptions, 'wrapper'>;
  } = {}
): RenderResult & { history: ReturnType<typeof createMemoryHistory> } {
  const {
    isAuthenticated = false,
    isSuperAdmin = false,
    initialEntries = ['/'],
    renderOptions = {}
  } = options;

  // Create a memory history object
  const history = createMemoryHistory({ initialEntries });

  // Provide a value for the AuthContext
  const authValue = {
    session: isAuthenticated ? mockSession : null,
    user: isAuthenticated ? mockSession.user : null,
    signIn: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    loading: false,
    isSuperAdmin: isSuperAdmin,
    fuelPumpName: 'Test Fuel Pump',
    refreshSession: jest.fn(),
    requirePasswordChange: false,
    setRequirePasswordChange: jest.fn()
  };

  // Wrap component with necessary providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </AuthProvider>
  );

  // Render with the wrapper
  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    history
  };
}

// Function to set mobile view for testing
export function setMobileMode(isMobile: boolean): void {
  // Set window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: isMobile ? 375 : 1024
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: isMobile ? 812 : 768
  });

  // Fire resize event
  window.dispatchEvent(new Event('resize'));

  // Set matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: isMobile ? query.includes('max-width: 768px') : !query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  });
}

// Helper to mock Supabase queries
export function mockSupabaseQuery(
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  responseData: any,
  error: any = null
): void {
  // Create a mock implementation for supabase client
  const mockSupabaseFrom = jest.requireMock('@/integrations/supabase/client').supabase.from;
  
  mockSupabaseFrom.mockImplementation((table) => {
    if (table === tableName) {
      const methods = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        data: responseData,
        error: error
      };
      
      // For chained methods like .select().eq().data
      Object.keys(methods).forEach(key => {
        if (typeof methods[key] === 'function') {
          methods[key].mockReturnValue({
            ...methods,
            data: responseData,
            error: error
          });
        }
      });
      
      return methods;
    }
    
    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    };
  });
}
