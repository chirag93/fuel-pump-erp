
import { renderHook, act } from '@testing-library/react';
import { useCustomerData } from '../useCustomerData';
import { getCustomerById } from '@/integrations/customers';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
jest.mock('@/integrations/customers', () => ({
  getCustomerById: jest.fn(),
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
) as jest.Mock;

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('useCustomerData', () => {
  const mockCustomerId = '123';
  const mockCustomer = { 
    id: mockCustomerId, 
    name: 'Test Customer',
    balance: 1000,
    contact: 'Test Contact',
    email: 'test@example.com',
    phone: '1234567890',
    gst: 'GST123456',
    created_at: new Date().toISOString()
  };
  
  const mockVehicles = [{ id: 'v1', number: 'ABC123', customer_id: mockCustomerId, capacity: '500L', type: 'Truck' }];
  const mockIndents = [{ id: 'i1', customer_id: mockCustomerId, vehicles: { number: 'ABC123' } }];
  const mockIndentBooklets = [{ id: 'b1', customer_id: mockCustomerId, status: 'Active' }];
  const mockTransactions = [{ 
    id: 't1', 
    customer_id: mockCustomerId, 
    vehicles: { number: 'ABC123' },
    staff_id: 'staff1',
    date: new Date().toISOString(),
    fuel_type: 'DIESEL',
    amount: 5000,
    quantity: 50,
    payment_method: 'CREDIT',
    created_at: new Date().toISOString()
  }];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock customer data fetch
    (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);
    
    // Mock fetch API calls
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === `/api/customers/${mockCustomerId}`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCustomer)
        });
      } else if (url === `/api/vehicles?customer_id=${mockCustomerId}`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVehicles)
        });
      } else if (url.includes('/api/indents')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIndents)
        });
      } else if (url.includes('/api/transactions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTransactions)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    // Mock Supabase from method for different tables
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'vehicles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockVehicles, error: null })
        };
      } else if (table === 'indents') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockIndents, error: null })
        };
      } else if (table === 'indent_booklets') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockIndentBooklets, error: null })
        };
      } else if (table === 'transactions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: mockTransactions, error: null })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
      };
    });
  });

  it('fetches customer data successfully', async () => {
    const { result } = renderHook(() => useCustomerData(mockCustomerId));
    
    // Initial state should have loading true
    expect(result.current.isLoading).toBe(true);
    
    // Wait for data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify data is loaded
    expect(getCustomerById).toHaveBeenCalledWith(mockCustomerId);
    expect(result.current.customer).toEqual(mockCustomer);
    expect(result.current.isLoading).toBe(false);
  });

  it('refreshes data when refreshData is called', async () => {
    const { result } = renderHook(() => useCustomerData(mockCustomerId));
    
    // Wait for initial data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Clear mocks to check if they're called again
    jest.clearAllMocks();
    
    // Call refresh function
    act(() => {
      result.current.refreshData();
    });
    
    // Wait for refresh to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify data is fetched again
    expect(getCustomerById).toHaveBeenCalledWith(mockCustomerId);
  });
});
