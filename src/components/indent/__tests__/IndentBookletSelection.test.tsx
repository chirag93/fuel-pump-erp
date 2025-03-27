
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IndentBookletSelection } from '@/components/indent/IndentBookletSelection';
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

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('IndentBookletSelection Component', () => {
  const defaultProps = {
    selectedCustomer: '',
    selectedBooklet: '',
    setSelectedBooklet: jest.fn(),
    indentNumber: '',
    setIndentNumber: jest.fn(),
    indentNumberError: '',
    setIndentNumberError: jest.fn(),
    setSelectedCustomer: jest.fn(),
    setSelectedVehicle: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for customers
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'customers') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: [
              { id: 'customer-1', name: 'Test Customer', contact: 'Test Contact' },
              { id: 'customer-2', name: 'Another Customer', contact: 'Another Contact' }
            ],
            error: null
          })
        };
      } else if (table === 'indent_booklets') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue({
            data: [
              { 
                id: 'booklet-1', 
                start_number: '1001', 
                end_number: '1050',
                used_indents: 5,
                total_indents: 50,
                status: 'Active'
              }
            ],
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
  });

  it('renders customer selection dropdown', async () => {
    render(<IndentBookletSelection {...defaultProps} />);
    
    // Check for customer selection
    await waitFor(() => {
      expect(screen.getByText('Select Customer')).toBeInTheDocument();
      expect(screen.getByText('Test Customer - Test Contact')).toBeInTheDocument();
      expect(screen.getByText('Another Customer - Another Contact')).toBeInTheDocument();
    });
  });

  it('calls setSelectedCustomer when a customer is selected', async () => {
    render(<IndentBookletSelection {...defaultProps} />);
    
    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Test Customer - Test Contact')).toBeInTheDocument();
    });
    
    // Select a customer
    fireEvent.change(screen.getByRole('combobox', { name: /customer/i }), { target: { value: 'customer-1' } });
    
    // Check that setSelectedCustomer was called with the correct value
    expect(defaultProps.setSelectedCustomer).toHaveBeenCalledWith('customer-1');
  });

  it('displays booklet selection when a customer is selected', async () => {
    render(<IndentBookletSelection {...defaultProps} selectedCustomer="customer-1" />);
    
    // Check for booklet selection
    await waitFor(() => {
      expect(screen.getByText('Select Booklet (Optional)')).toBeInTheDocument();
      expect(screen.getByText('1001-1050 (45 remaining)')).toBeInTheDocument();
    });
  });

  it('shows indent number input when a booklet is selected', async () => {
    render(
      <IndentBookletSelection 
        {...defaultProps} 
        selectedCustomer="customer-1" 
        selectedBooklet="booklet-1" 
      />
    );
    
    // Check for indent number input
    await waitFor(() => {
      expect(screen.getByLabelText(/indent number/i)).toBeInTheDocument();
    });
  });

  it('validates indent number within booklet range', async () => {
    render(
      <IndentBookletSelection 
        {...defaultProps} 
        selectedCustomer="customer-1" 
        selectedBooklet="booklet-1" 
      />
    );
    
    // Enter a valid indent number
    const indentNumberInput = await screen.findByLabelText(/indent number/i);
    fireEvent.change(indentNumberInput, { target: { value: '1010' } });
    
    // Should not set an error
    expect(defaultProps.setIndentNumberError).not.toHaveBeenCalled();
    expect(defaultProps.setIndentNumber).toHaveBeenCalledWith('1010');
  });

  it('shows error for indent number outside booklet range', async () => {
    render(
      <IndentBookletSelection 
        {...defaultProps} 
        selectedCustomer="customer-1" 
        selectedBooklet="booklet-1" 
      />
    );
    
    // Enter an invalid indent number (outside range)
    const indentNumberInput = await screen.findByLabelText(/indent number/i);
    fireEvent.change(indentNumberInput, { target: { value: '2000' } });
    
    // Should set an error
    expect(defaultProps.setIndentNumberError).toHaveBeenCalledWith(
      expect.stringContaining('outside the valid range for this booklet')
    );
  });

  it('handles errors when loading customers', async () => {
    // Mock Supabase response with an error
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'customers') {
        return {
          select: jest.fn().mockReturnThis(),
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
    
    render(<IndentBookletSelection {...defaultProps} />);
    
    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('No customers found')).toBeInTheDocument();
    });
  });
});
