
import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { vi } from 'vitest';

// Simple mock session data for testing
const DEFAULT_MOCK_SESSION = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'manager'
  },
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token'
};

type CustomRenderOptions = {
  isAuthenticated?: boolean;
  isSuperAdmin?: boolean;
  initialEntries?: string[];
  initialRoute?: string;
  mockSession?: typeof DEFAULT_MOCK_SESSION;
} & Omit<RenderOptions, 'wrapper'>;

/**
 * A simplified render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    isAuthenticated = false,
    isSuperAdmin = false,
    initialEntries = ['/'],
    initialRoute = '/',
    mockSession = DEFAULT_MOCK_SESSION,
    ...renderOptions
  } = options;

  // Create auth context value
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

  // Create a basic wrapper with providers
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Set up the browser environment for mobile device testing
 */
export function setupMobileViewport(): void {
  // Set window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375 // iPhone X width
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 812 // iPhone X height
  });

  // Fire resize event
  window.dispatchEvent(new Event('resize'));

  // Setup mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: query.includes('max-width: 768px'),
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

/**
 * A simplified mock for Supabase queries
 */
export function mockSupabaseQuery(mockData: any, mockError: any = null): void {
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        data: mockData,
        error: mockError
      }))
    }
  }));
}
