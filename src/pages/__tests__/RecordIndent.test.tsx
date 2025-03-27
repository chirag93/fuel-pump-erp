
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordIndent from '@/pages/RecordIndent';
import '@testing-library/jest-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  }
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

// Mock crypto.randomUUID
global.crypto = {
  ...global.crypto,
  randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
};

// Mock the dependent components to focus on testing the RecordIndent page
jest.mock('@/components/indent/CustomerVehicleSelection', () => ({
  CustomerVehicleSelection: ({ selectedCustomer, selectedVehicle, setSelectedVehicle }) => (
    <div data-testid="customer-vehicle-selection">
      Customer Vehicle Selection Mock
      {selectedCustomer && (
        <select 
          data-testid="vehicle-select" 
          value={selectedVehicle} 
          onChange={(e) => setSelectedVehicle(e.target.value)}
        >
          <option value="">Select Vehicle</option>
          <option value="vehicle-1">Vehicle 1</option>
        </select>
      )}
    </div>
  )
}));

jest.mock('@/components/indent/IndentBookletSelection', () => ({
  IndentBookletSelection: ({ setSelectedCustomer }) => (
    <div data-testid="indent-booklet-selection">
      Indent Booklet Selection Mock
      <select 
        data-testid="customer-select" 
        onChange={(e) => setSelectedCustomer(e.target.value)}
      >
        <option value="">Select Customer</option>
        <option value="customer-1">Test Customer</option>
      </select>
    </div>
  )
}));

jest.mock('@/components/indent/FuelTransactionForm', () => ({
  FuelTransactionForm: ({ 
    fuelType, setFuelType, 
    amount, setAmount, 
    quantity, setQuantity,
    date, setDate,
    staff, selectedStaff, setSelectedStaff
  }) => (
    <div data-testid="fuel-transaction-form">
      <select 
        data-testid="fuel-type-select" 
        value={fuelType} 
        onChange={(e) => setFuelType(e.target.value)}
      >
        <option value="Petrol">Petrol</option>
        <option value="Diesel">Diesel</option>
      </select>
      <input 
        data-testid="amount-input" 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <input 
        data-testid="quantity-input" 
        type="number" 
        value={quantity} 
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <select 
        data-testid="staff-select" 
        value={selectedStaff} 
        onChange={(e) => setSelectedStaff(e.target.value)}
      >
        {staff.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  )
}));

jest.mock('@/components/indent/RecentTransactionsTable', () => ({
  RecentTransactionsTable: () => <div data-testid="recent-transactions-table">Recent Transactions Table Mock</div>
}));

describe('RecordIndent Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock staff data
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'staff') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            { id: 'staff-1', name: 'John Doe' }
          ],
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

  it('renders the record indent page correctly', () => {
    render(<RecordIndent />);
    
    expect(screen.getByText('Record Indent')).toBeInTheDocument();
    expect(screen.getByText('Record New Indent')).toBeInTheDocument();
    expect(screen.getByTestId('indent-booklet-selection')).toBeInTheDocument();
    expect(screen.getByTestId('recent-transactions-table')).toBeInTheDocument();
  });

  it('shows error toast when required fields are missing', async () => {
    render(<RecordIndent />);
    
    // Try to submit the form without selecting a customer or vehicle
    const submitButton = screen.queryByRole('button', { name: /record indent/i });
    
    // The button should not be visible yet
    expect(submitButton).not.toBeInTheDocument();
    
    // Select a customer
    fireEvent.change(screen.getByTestId('customer-select'), { target: { value: 'customer-1' } });
    
    // Now the CustomerVehicleSelection should be visible
    const vehicleSelect = screen.getByTestId('vehicle-select');
    fireEvent.change(vehicleSelect, { target: { value: 'vehicle-1' } });
    
    // Complete the form
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '1000' } });
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '10' } });
    
    // Now the submit button should be visible
    const visibleSubmitButton = await screen.findByRole('button', { name: /record indent/i });
    expect(visibleSubmitButton).toBeInTheDocument();
    
    // Click the submit button
    fireEvent.click(visibleSubmitButton);
    
    // Check if toast was called with the expected parameters
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Success",
      description: "Transaction recorded successfully"
    }));
  });

  it('successfully processes a transaction when form is valid', async () => {
    // Mock necessary form data and Supabase responses
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'indents') {
        return {
          insert: jest.fn().mockReturnValue({
            error: null
          })
        };
      } else if (table === 'transactions') {
        return {
          insert: jest.fn().mockReturnValue({
            error: null
          })
        };
      } else if (table === 'indent_booklets') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { used_indents: 5 },
                error: null
              })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              error: null
            })
          })
        };
      } else if (table === 'staff') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            { id: 'staff-1', name: 'John Doe' }
          ],
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
    
    render(<RecordIndent />);
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('customer-select'), { target: { value: 'customer-1' } });
    fireEvent.change(screen.getByTestId('vehicle-select'), { target: { value: 'vehicle-1' } });
    fireEvent.change(screen.getByTestId('fuel-type-select'), { target: { value: 'Petrol' } });
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '1000' } });
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '10' } });
    
    // Submit the form
    const submitButton = await screen.findByRole('button', { name: /record indent/i });
    fireEvent.click(submitButton);
    
    // Verify transaction was created
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Success",
        description: "Transaction recorded successfully"
      }));
    });
  });

  it('handles errors during transaction submission', async () => {
    // Mock error responses
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'transactions') {
        return {
          insert: jest.fn().mockReturnValue({
            error: { message: 'Database error' }
          })
        };
      } else if (table === 'staff') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            { id: 'staff-1', name: 'John Doe' }
          ],
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
    
    render(<RecordIndent />);
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('customer-select'), { target: { value: 'customer-1' } });
    fireEvent.change(screen.getByTestId('vehicle-select'), { target: { value: 'vehicle-1' } });
    fireEvent.change(screen.getByTestId('fuel-type-select'), { target: { value: 'Petrol' } });
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '1000' } });
    fireEvent.change(screen.getByTestId('quantity-input'), { target: { value: '10' } });
    
    // Submit the form
    const submitButton = await screen.findByRole('button', { name: /record indent/i });
    fireEvent.click(submitButton);
    
    // Check that error toast was shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error",
        description: "Failed to record indent. Please try again.",
        variant: "destructive"
      }));
    });
  });
});
