
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerVehicleSelection } from '@/components/indent/CustomerVehicleSelection';
import { supabase } from "@/integrations/supabase/client";
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis()
  }
}));

describe('CustomerVehicleSelection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when no customer is selected', () => {
    const setSelectedVehicle = jest.fn();
    
    render(
      <CustomerVehicleSelection
        selectedCustomer=""
        selectedVehicle=""
        setSelectedVehicle={setSelectedVehicle}
      />
    );
    
    // Component should not display vehicles when no customer is selected
    expect(screen.queryByText('Select Vehicle')).not.toBeInTheDocument();
  });

  it('loads and displays vehicles when a customer is selected', async () => {
    const mockVehicles = [
      { id: 'vehicle-1', number: 'ABC123', type: 'Car' },
      { id: 'vehicle-2', number: 'XYZ789', type: 'Truck' }
    ];
    
    // Mock Supabase response for vehicles
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'vehicles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: mockVehicles,
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      };
    });
    
    const setSelectedVehicle = jest.fn();
    
    render(
      <CustomerVehicleSelection
        selectedCustomer="customer-1"
        selectedVehicle=""
        setSelectedVehicle={setSelectedVehicle}
      />
    );
    
    // Check that vehicles are displayed
    await waitFor(() => {
      expect(screen.getByText('Select Vehicle')).toBeInTheDocument();
      expect(screen.getByText('ABC123 - Car')).toBeInTheDocument();
      expect(screen.getByText('XYZ789 - Truck')).toBeInTheDocument();
    });
  });

  it('calls setSelectedVehicle when a vehicle is selected', async () => {
    const mockVehicles = [
      { id: 'vehicle-1', number: 'ABC123', type: 'Car' },
      { id: 'vehicle-2', number: 'XYZ789', type: 'Truck' }
    ];
    
    // Mock Supabase response for vehicles
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'vehicles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: mockVehicles,
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      };
    });
    
    const setSelectedVehicle = jest.fn();
    
    render(
      <CustomerVehicleSelection
        selectedCustomer="customer-1"
        selectedVehicle=""
        setSelectedVehicle={setSelectedVehicle}
      />
    );
    
    // Wait for vehicles to load
    await waitFor(() => {
      expect(screen.getByText('ABC123 - Car')).toBeInTheDocument();
    });
    
    // Select a vehicle
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'vehicle-2' } });
    
    // Check that setSelectedVehicle was called with the correct value
    expect(setSelectedVehicle).toHaveBeenCalledWith('vehicle-2');
  });
  
  it('handles errors when loading vehicles', async () => {
    // Mock Supabase response with an error
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'vehicles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: null,
            error: { message: 'Database error' }
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      };
    });
    
    const setSelectedVehicle = jest.fn();
    
    render(
      <CustomerVehicleSelection
        selectedCustomer="customer-1"
        selectedVehicle=""
        setSelectedVehicle={setSelectedVehicle}
      />
    );
    
    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('No vehicles found for this customer')).toBeInTheDocument();
    });
  });
});
