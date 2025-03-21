
import { getAllCustomers, getCustomerById, createCustomer, updateCustomer, updateCustomerBalance } from '../customers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock console.error to avoid cluttering test output
console.error = jest.fn();

describe('Customer Integration Tests', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCustomers', () => {
    it('should fetch all customers successfully', async () => {
      // Mock successful response
      const mockData = [{ id: '1', name: 'Test Customer' }];
      const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      } as any);

      const result = await getAllCustomers();

      expect(fromSpy).toHaveBeenCalledWith('customers');
      expect(result).toEqual(mockData);
    });

    it('should handle errors and show toast', async () => {
      // Mock error response
      const mockError = new Error('Database error');
      const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: mockError })
        })
      } as any);

      const result = await getAllCustomers();

      expect(console.error).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive'
      });
      expect(result).toEqual([]);
    });
  });

  describe('getCustomerById', () => {
    it('should fetch a customer by ID successfully', async () => {
      // Mock successful response
      const mockData = { 
        id: '1', 
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        contact: 'Test Contact',
        gst: 'GST123456',
        balance: 1000,
        created_at: new Date().toISOString()
      };
      
      const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      } as any);

      const result = await getCustomerById('1');

      expect(fromSpy).toHaveBeenCalledWith('customers');
      expect(result).toEqual(mockData);
    });

    it('should handle errors when fetching by ID', async () => {
      // Mock error response
      const mockError = new Error('Not found');
      const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      } as any);

      const result = await getCustomerById('999');

      expect(console.error).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to load customer data',
        variant: 'destructive'
      });
      expect(result).toBeNull();
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const newCustomer = { 
        name: 'New Customer', 
        email: 'new@example.com',
        phone: '9876543210',
        contact: 'New Contact',
        gst: 'GST987654',
        balance: 0
      };
      
      const mockData = { 
        id: '123', 
        ...newCustomer, 
        created_at: new Date().toISOString() 
      };
      
      const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      } as any);

      const result = await createCustomer(newCustomer);

      expect(fromSpy).toHaveBeenCalledWith('customers');
      expect(toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Customer created successfully'
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('updateCustomerBalance', () => {
    it('should update customer balance successfully', async () => {
      const customerId = '123';
      const newBalance = 500;
      
      const fromSpy = jest.spyOn(supabase, 'from').mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      } as any);

      const result = await updateCustomerBalance(customerId, newBalance);

      expect(fromSpy).toHaveBeenCalledWith('customers');
      expect(result).toBeTruthy();
    });
  });
});
