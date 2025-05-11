import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';
// Correctly import within and fireEvent from testing-library/dom instead of react
import { within, fireEvent } from '@testing-library/dom';

// Mock fetch API globally for all tests
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    clone: () => ({ json: () => Promise.resolve({}) })
  })
) as unknown as typeof fetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Supabase client for tests with more comprehensive mocks
vi.mock('@/integrations/supabase/client', () => {
  const mockFrom = vi.fn().mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    then: vi.fn(),
    data: null,
    error: null
  }));

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        updateUser: vi.fn()
      },
      functions: {
        invoke: vi.fn()
      }
    }
  };
});

// Mock ResizeObserver which isn't available in test environment but used by some UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock the date-picker component since it's causing issues in tests
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ date, setDate }) => {
    return {
      render: () => ({
        type: 'div',
        props: {
          'data-testid': 'mock-date-picker',
          children: [{
            type: 'button',
            props: {
              onClick: () => setDate?.(new Date())
            },
            children: ['Select Date']
          }]
        }
      })
    };
  }
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});
