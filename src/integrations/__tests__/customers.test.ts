
import { getAllCustomers, getCustomerById, createCustomer, updateCustomer, updateCustomerBalance } from '../customers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  },
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('Customer Integration Tests', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCustomers', () => {
    it('should fetch all customers successfully', async () => {
      // Mock successful response
      const mockData = [{ id: '1', name: 'Test Customer' }];
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.order as jest.Mock).mockResolvedValue({ data: mockData, error: null });

      const result = await getAllCustomers();

      expect(supabase.from).toHaveBeenCalledWith('customers');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.order).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockData);
    });

    it('should handle errors and show toast', async () => {
      // Mock error response
      const mockError = new Error('Database error');
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.order as jest.Mock).mockResolvedValue({ data: null, error: mockError });

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
      const mockData = { id: '1', name: 'Test Customer' };
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({ data: mockData, error: null });

      const result = await getCustomerById('1');

      expect(supabase.from).toHaveBeenCalledWith('customers');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should handle errors when fetching by ID', async () => {
      // Mock error response
      const mockError = new Error('Not found');
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({ data: null, error: mockError });

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

  // Add more tests for other functions
  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const newCustomer = { name: 'New Customer', email: 'new@example.com' };
      const mockData = { id: '123', ...newCustomer, created_at: new Date().toISOString() };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({ data: mockData, error: null });

      const result = await createCustomer(newCustomer);

      expect(supabase.from).toHaveBeenCalledWith('customers');
      expect(supabase.insert).toHaveBeenCalledWith([newCustomer]);
      expect(supabase.select).toHaveBeenCalled();
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
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.update as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockResolvedValue({ error: null });

      const result = await updateCustomerBalance(customerId, newBalance);

      expect(supabase.from).toHaveBeenCalledWith('customers');
      expect(supabase.update).toHaveBeenCalledWith({ balance: newBalance });
      expect(supabase.eq).toHaveBeenCalledWith('id', customerId);
      expect(result).toBeTruthy();
    });
  });
});
