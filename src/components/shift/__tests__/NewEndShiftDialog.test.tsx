
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewEndShiftDialog } from '@/components/shift/NewEndShiftDialog';
import '@testing-library/jest-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  }
}));

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn()
}));

// Mock useEndShift hook
jest.mock('@/hooks/useEndShift', () => ({
  useEndShift: jest.fn().mockImplementation((shiftData, onShiftEnded, onClose) => {
    return {
      formData: {
        closingReading: '',
        cashRemaining: '',
        expenses: '',
        testingFuel: '0',
        cardSales: '',
        upiSales: '',
        cashSales: '',
        selectedStaff: '',
        createNewShift: true
      },
      updateFormData: jest.fn(),
      isLoading: false,
      error: null,
      staff: [
        { id: 'staff-1', name: 'John Doe', role: 'Attendant' },
        { id: 'staff-2', name: 'Jane Smith', role: 'Manager' }
      ],
      fuelPrice: 100,
      totalSales: 0,
      allocatedConsumables: [],
      returnedConsumables: [],
      updateReturnedConsumable: jest.fn(),
      consumablesExpense: 0,
      cashReconciliation: { expected: 0, difference: 0 },
      handleEndShift: jest.fn(),
      testingFuelAmount: 0,
      fuelLiters: 0,
      expectedSalesAmount: 0
    };
  })
}));

describe('NewEndShiftDialog Component', () => {
  const mockOnClose = jest.fn();
  const mockOnShiftEnded = jest.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    shiftData: {
      id: 'shift-1',
      staff_id: 'staff-1',
      staff_name: 'John Doe',
      pump_id: 'P001',
      opening_reading: 1000,
      shift_type: 'day'
    },
    onShiftEnded: mockOnShiftEnded
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock responses
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'fuel_settings') {
        return {
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          data: [{ current_price: 100.0 }],
          error: null
        };
      } else if (table === 'staff') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            { id: 'staff-1', name: 'John Doe', role: 'Attendant' },
            { id: 'staff-2', name: 'Jane Smith', role: 'Manager' }
          ],
          error: null
        };
      } else if (table === 'shifts') {
        return {
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          data: [{ id: 'new-shift-1' }],
          error: null
        };
      } else if (table === 'readings') {
        return {
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          error: null
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };
    });
  });

  it('renders the end shift dialog correctly', () => {
    render(<NewEndShiftDialog {...defaultProps} />);
    
    expect(screen.getByText('End Shift')).toBeInTheDocument();
    expect(screen.getByText(/You are ending John Doe's day shift/)).toBeInTheDocument();
    expect(screen.getByLabelText('Closing Reading')).toBeInTheDocument();
    expect(screen.getByLabelText('Testing Fuel Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Card Sales (₹)')).toBeInTheDocument();
    expect(screen.getByLabelText('UPI Sales (₹)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cash Sales (₹)')).toBeInTheDocument();
    expect(screen.getByLabelText('Expenses (₹)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cash Remaining (₹)')).toBeInTheDocument();
    expect(screen.getByText('Create new shift for this pump')).toBeInTheDocument();
  });
});
