
// Setup file for mobile-specific tests
import { vi } from 'vitest';

// Mock the useIsMobile hook to always return true for mobile tests
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => true)
}));

// Mock window dimensions to mobile size
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

// Mock matchMedia
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
    dispatchEvent: vi.fn(),
  }))
});
