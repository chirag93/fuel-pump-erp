
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Added these settings to fix potential issues
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  // Mock fetch globally
  setupFiles: ['./src/setupTests.ts'],
  // Configure special test setups
  projects: [
    {
      displayName: 'web',
      testMatch: ['**/__tests__/**/!(mobile|superadmin)*.test.(ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
    },
    {
      displayName: 'mobile',
      testMatch: ['**/__tests__/**/mobile*.test.(ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/src/setupMobileTests.ts']
    },
    {
      displayName: 'superadmin',
      testMatch: ['**/__tests__/**/superadmin*.test.(ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['**/integrations/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
    }
  ]
};

export default config;
