
import { getIndentsByCustomerId, getIndentsByBookletId } from '../indents';
import { supabase } from '../supabase/client';
import { toast } from '@/hooks/use-toast';

// Mock Supabase client
jest.mock('../supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis()
  }
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('Indents Integration Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIndentsByCustomerId', () => {
    it('returns indents for a customer with vehicle info', async () => {
      const mockIndents = [
        {
          id: 'indent-1',
          customer_id: 'customer-1',
          vehicle_id: 'vehicle-1',
          fuel_type: 'Petrol',
          amount: 1000,
          quantity: 10,
          vehicles: { number: 'ABC123' },
          transactions: []
        }
      ];

      // Mock Supabase response
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          data: mockIndents,
          error: null
        })
      }));

      const result = await getIndentsByCustomerId('customer-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].vehicle_number).toBe('ABC123');
    });

    it('handles errors when fetching indents', async () => {
      // Mock Supabase response with an error
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          data: null,
          error: { message: 'Database error' }
        })
      }));

      const result = await getIndentsByCustomerId('customer-1');
      
      expect(result).toEqual([]);
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error",
        description: "Failed to load indents data",
        variant: "destructive"
      }));
    });
  });

  describe('getIndentsByBookletId', () => {
    it('returns indents for a booklet with transaction info', async () => {
      const mockIndents = [
        {
          id: 'indent-1',
          booklet_id: 'booklet-1',
          customer_id: 'customer-1',
          vehicle_id: 'vehicle-1',
          fuel_type: 'Petrol',
          amount: 1000,
          quantity: 10,
          vehicles: { number: 'ABC123' }
        }
      ];

      const mockTransactions = [
        {
          id: 'trx-1',
          indent_id: 'indent-1',
          amount: 1000,
          quantity: 10
        }
      ];

      // Mock Supabase responses
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'indents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              data: mockIndents,
              error: null
            })
          };
        } else if (table === 'transactions') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnValue({
              data: mockTransactions,
              error: null
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis()
        };
      });

      const result = await getIndentsByBookletId('booklet-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].vehicle_number).toBe('ABC123');
      expect(result[0]).toHaveProperty('transaction');
    });

    it('handles errors when fetching indents by booklet', async () => {
      // Mock Supabase response with an error
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          data: null,
          error: { message: 'Database error' }
        })
      }));

      const result = await getIndentsByBookletId('booklet-1');
      
      expect(result).toEqual([]);
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error",
        description: "Failed to load indents data",
        variant: "destructive"
      }));
    });
  });
});
