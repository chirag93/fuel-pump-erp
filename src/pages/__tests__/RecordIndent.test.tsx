
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
  CustomerVehicleSelection: () => <div data-testid="customer-vehicle-selection">Customer Vehicle Selection Mock</div>
}));

jest.mock('@/components/indent/IndentBookletSelection', () => ({
  IndentBookletSelection: () => <div data-testid="indent-booklet-selection">Indent Booklet Selection Mock</div>
}));

jest.mock('@/components/indent/FuelTransactionForm', () => ({
  FuelTransactionForm: ({ onSubmit }) => (
    <div data-testid="fuel-transaction-form">
      Fuel Transaction Form Mock
      <button data-testid="submit-form" onClick={onSubmit}>Submit Form</button>
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
    const submitButton = screen.getByTestId('submit-form');
    fireEvent.click(submitButton);
    
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Missing information",
      variant: "destructive"
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
    
    // Would need a more complex setup to fully test the transaction flow
    // This is just a skeleton example
  });
});
