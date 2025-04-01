
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionsTable from '../TransactionsTable';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
) as jest.Mock;

// Mock the BillPreviewDialog component
vi.mock('@/components/indent/BillPreviewDialog', () => {
  return function MockBillPreviewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return open ? <div data-testid="bill-preview-dialog">Bill Preview Dialog</div> : null;
  };
});

describe('TransactionsTable', () => {
  const mockCustomer = {
    id: '123',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '1234567890',
    contact: 'Test Contact',
    gst: 'GST123456',
    balance: 1000,
    created_at: new Date().toISOString()
  };

  const mockTransactions = [
    {
      id: '1',
      customer_id: '123',
      vehicle_id: 'v1',
      vehicle_number: 'ABC123',
      fuel_type: 'DIESEL',
      quantity: 50,
      amount: 5000,
      payment_method: 'CREDIT',
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      staff_id: 'staff1',
      indent_id: null,
      discount_amount: null
    },
    {
      id: '2',
      customer_id: '123',
      fuel_type: 'PAYMENT',
      amount: 2000,
      payment_method: 'CASH',
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      staff_id: 'staff1',
      vehicle_id: null,
      quantity: 0,
      indent_id: null,
      discount_amount: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transactions correctly', () => {
    render(<TransactionsTable transactions={mockTransactions} customer={mockCustomer} />);
    
    // Check table headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Fuel Type')).toBeInTheDocument();
    
    // Check transaction data
    expect(screen.getByText('DIESEL')).toBeInTheDocument();
    expect(screen.getByText('50 L')).toBeInTheDocument();
    expect(screen.getByText('CREDIT')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    
    // Check payment transaction
    expect(screen.getByText('PAYMENT')).toBeInTheDocument();
    expect(screen.getByText('CASH')).toBeInTheDocument();
  });

  it('opens bill preview dialog when clicking bill button', async () => {
    const user = userEvent.setup();
    
    render(<TransactionsTable transactions={mockTransactions} customer={mockCustomer} />);
    
    // Bill button only available for non-payment transactions
    const billButton = screen.getByText('Bill');
    expect(billButton).toBeInTheDocument();
    
    // Click the bill button
    await user.click(billButton);
    
    // Check if dialog is shown
    expect(screen.getByTestId('bill-preview-dialog')).toBeInTheDocument();
  });

  it('displays empty state message when no transactions exist', () => {
    render(<TransactionsTable transactions={[]} customer={mockCustomer} />);
    
    expect(screen.getByText('No transactions found for this customer in the selected date range.')).toBeInTheDocument();
  });
});
