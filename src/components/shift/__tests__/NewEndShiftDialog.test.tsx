
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
    expect(screen.getByText('Closing Reading')).toBeInTheDocument();
    expect(screen.getByText('Testing Fuel Quantity')).toBeInTheDocument();
    expect(screen.getByText('Card Sales (₹)')).toBeInTheDocument();
    expect(screen.getByText('UPI Sales (₹)')).toBeInTheDocument();
    expect(screen.getByText('Cash Sales (₹)')).toBeInTheDocument();
    expect(screen.getByText('Expenses (₹)')).toBeInTheDocument();
    expect(screen.getByText('Cash Remaining (₹)')).toBeInTheDocument();
    expect(screen.getByText('Create new shift for this pump')).toBeInTheDocument();
  });

  it('validates form inputs correctly', async () => {
    const user = userEvent.setup();
    render(<NewEndShiftDialog {...defaultProps} />);
    
    // Click end shift button without filling required fields
    const endShiftButton = screen.getByRole('button', { name: 'End Shift' });
    await user.click(endShiftButton);
    
    // Should show validation error
    expect(screen.getByText('Please enter a valid closing reading')).toBeInTheDocument();
  });

  it('ends shift successfully with valid inputs', async () => {
    const user = userEvent.setup();
    render(<NewEndShiftDialog {...defaultProps} />);
    
    // Fill in required fields
    const closingReadingInput = screen.getByLabelText('Closing Reading');
    await user.clear(closingReadingInput);
    await user.type(closingReadingInput, '1500');
    
    const cashRemainingInput = screen.getByLabelText('Cash Remaining (₹)');
    await user.clear(cashRemainingInput);
    await user.type(cashRemainingInput, '5000');
    
    const cashSalesInput = screen.getByLabelText('Cash Sales (₹)');
    await user.clear(cashSalesInput);
    await user.type(cashSalesInput, '5000');
    
    // Select staff for next shift
    const staffSelect = screen.getByText('Select staff member');
    await user.click(staffSelect);
    const staffOption = screen.getByText('Jane Smith (Manager)');
    await user.click(staffOption);
    
    // Click end shift button
    const endShiftButton = screen.getByRole('button', { name: 'End Shift' });
    await user.click(endShiftButton);
    
    // Wait for the operation to complete
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Shift ended successfully"
      }));
      expect(mockOnShiftEnded).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
