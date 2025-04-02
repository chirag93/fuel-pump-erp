
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { getTransactionsByCustomerId, createTransaction } from '@/integrations/transactions';
import { supabase } from '@/integrations/supabase/client';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

// Mock getFuelPumpId utility
vi.mock('@/integrations/utils', () => ({
  getFuelPumpId: vi.fn().mockResolvedValue('test-fuel-pump-id')
}));

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid'
}));

describe('Transaction Integration Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('getTransactionsByCustomerId fetches transactions for a customer', async () => {
    // Setup mock response
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      data: [
        {
          id: 'tx1',
          customer_id: 'cust1',
          date: '2023-06-10',
          amount: 1000,
          fuel_type: 'petrol',
          quantity: 10,
          payment_method: 'cash',
          vehicles: { number: 'ABC123' },
          source: 'web'
        }
      ],
      error: null
    } as any);

    const transactions = await getTransactionsByCustomerId('cust1');
    
    // Check results
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(1000);
    expect(transactions[0].vehicle_number).toBe('ABC123');
    
    // Verify supabase calls
    expect(supabase.from).toHaveBeenCalledWith('transactions');
  });

  test('createTransaction adds a new transaction', async () => {
    // Setup mock response
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      data: {
        id: 'test-uuid',
        customer_id: 'cust1',
        date: '2023-06-10',
        amount: 500,
        fuel_type: 'diesel',
        quantity: 5,
        payment_method: 'card',
        staff_id: 'staff1',
        vehicle_id: null,
        indent_id: null,
        discount_amount: 0
      },
      error: null
    } as any);

    const newTransactionData = {
      customer_id: 'cust1',
      date: '2023-06-10',
      amount: 500,
      fuel_type: 'diesel',
      quantity: 5,
      payment_method: 'card',
      staff_id: 'staff1',
      vehicle_id: null,
      indent_id: null,
      discount_amount: 0
    };

    const transaction = await createTransaction(newTransactionData);
    
    // Check results
    expect(transaction).not.toBeNull();
    expect(transaction?.id).toBe('test-uuid');
    expect(transaction?.amount).toBe(500);
    
    // Verify supabase calls
    expect(supabase.from).toHaveBeenCalledWith('transactions');
  });

  test('handles error when getFuelPumpId returns null', async () => {
    // Mock getFuelPumpId to return null
    vi.mocked(require('@/integrations/utils').getFuelPumpId).mockResolvedValue(null);
    
    const transactions = await getTransactionsByCustomerId('cust1');
    
    // Should return empty array when no fuel pump ID
    expect(transactions).toHaveLength(0);
  });
});
