
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

// Mock fetch for API calls
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
) as jest.Mock;

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
    
    // Default fetch mock implementation
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/customers') && !url.includes('/api/customers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: '1', name: 'Test Customer' }])
        });
      } else if (url.includes('/api/customers/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            id: '1', 
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '1234567890',
            contact: 'Test Contact',
            gst: 'GST123456',
            balance: 1000,
            created_at: new Date().toISOString()
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
  });

  describe('getAllCustomers', () => {
    it('should fetch all customers successfully', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: '1', name: 'Test Customer' }])
      });

      const result = await getAllCustomers();

      expect(global.fetch).toHaveBeenCalledWith('/api/customers');
      expect(result).toEqual([{ id: '1', name: 'Test Customer' }]);
    });

    it('should handle errors and show toast', async () => {
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await getAllCustomers();

      expect(console.error).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
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
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const result = await getCustomerById('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/customers/1');
      expect(result).toEqual(mockData);
    });

    it('should handle errors when fetching by ID', async () => {
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await getCustomerById('999');

      expect(console.error).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive"
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
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, customer: mockData })
      });

      const result = await createCustomer(newCustomer);

      expect(global.fetch).toHaveBeenCalledWith('/api/customers', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      }));
      
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Customer created successfully"
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('updateCustomerBalance', () => {
    it('should update customer balance successfully', async () => {
      const customerId = '123';
      const newBalance = 500;
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await updateCustomerBalance(customerId, newBalance);

      expect(result).toBeTruthy();
    });
  });
});
