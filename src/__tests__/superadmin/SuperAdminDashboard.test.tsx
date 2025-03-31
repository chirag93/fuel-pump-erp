
import React from 'react';
import { render, screen } from '@testing-library/react';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import { renderWithProviders } from '@/test-utils/test-helpers';
import '@testing-library/jest-dom';

// Mock API responses
jest.mock('@/superadmin/api/superAdminApi', () => ({
  fetchFuelPumps: jest.fn().mockResolvedValue([
    { id: 'pump-1', name: 'Test Fuel Pump 1', location: 'Location 1', status: 'active' },
    { id: 'pump-2', name: 'Test Fuel Pump 2', location: 'Location 2', status: 'active' }
  ]),
  fetchSuperAdminAnalytics: jest.fn().mockResolvedValue({
    totalFuelPumps: 2,
    activeFuelPumps: 2,
    totalTransactions: 100,
    totalRevenue: 10000
  })
}));

describe('SuperAdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the super admin dashboard when authenticated', async () => {
    renderWithProviders(<SuperAdminDashboard />, { 
      isAuthenticated: true,
      isSuperAdmin: true 
    });
    
    // Wait for data to load
    expect(await screen.findByText('Super Admin Dashboard')).toBeInTheDocument();
    
    // Check if overview cards are present
    expect(await screen.findByText('Total Fuel Pumps')).toBeInTheDocument();
    expect(await screen.findByText('Active Fuel Pumps')).toBeInTheDocument();
    
    // Check if fuel pump list is present
    expect(await screen.findByText('Managed Fuel Pumps')).toBeInTheDocument();
    expect(await screen.findByText('Test Fuel Pump 1')).toBeInTheDocument();
    expect(await screen.findByText('Test Fuel Pump 2')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', async () => {
    const { history } = renderWithProviders(<SuperAdminDashboard />, { 
      isAuthenticated: false,
      isSuperAdmin: false 
    });
    
    // Check that we've been redirected to login
    expect(history.location.pathname).toBe('/super-admin/login');
  });
});
