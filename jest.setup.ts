import '@testing-library/jest-dom';

// Explicitly extend Jest's expect with the DOM matchers
import { expect } from '@jest/globals';
import { toBeInTheDocument } from '@testing-library/jest-dom/matchers';

expect.extend({ toBeInTheDocument });

// Set timeout for all tests (helps with CI environments)
jest.setTimeout(10000);

// Suppress console errors during tests to keep logs clean
global.console.error = jest.fn();

// Mock window.matchMedia for tests that require it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
