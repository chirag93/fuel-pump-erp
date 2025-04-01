
import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { createMemoryHistory } from 'history';
import { vi } from 'vitest';

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
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    loading: false,
    isSuperAdmin: isSuperAdmin,
    fuelPumpName: 'Test Fuel Pump',
    refreshSession: vi.fn(),
    requirePasswordChange: false,
    setRequirePasswordChange: vi.fn()
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
    value: vi.fn().mockImplementation(query => ({
      matches: isMobile ? query.includes('max-width: 768px') : !query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
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
  const mockSupabaseFrom = vi.hoisted(() => vi.fn());
  
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      from: mockSupabaseFrom
    }
  }));
  
  mockSupabaseFrom.mockImplementation((table) => {
    if (table === tableName) {
      const methods = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
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
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    };
  });
}
