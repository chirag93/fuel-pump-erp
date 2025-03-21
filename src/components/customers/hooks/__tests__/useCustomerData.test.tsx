
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
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('useCustomerData', () => {
  const mockCustomerId = '123';
  const mockCustomer = { 
    id: mockCustomerId, 
    name: 'Test Customer',
    balance: 1000 
  };
  const mockVehicles = [{ id: 'v1', number: 'ABC123', customer_id: mockCustomerId }];
  const mockIndents = [{ id: 'i1', customer_id: mockCustomerId, vehicles: { number: 'ABC123' } }];
  const mockIndentBooklets = [{ id: 'b1', customer_id: mockCustomerId, status: 'Active' }];
  const mockTransactions = [{ id: 't1', customer_id: mockCustomerId, vehicles: { number: 'ABC123' } }];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock customer data fetch
    (getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);
    
    // Mock vehicle data fetch
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'vehicles') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockVehicles, error: null })
          })
        };
      }
      return supabase;
    });
    
    // Mock indents data fetch
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'indents') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockIndents, error: null })
          })
        };
      }
      return supabase;
    });
    
    // Mock booklets data fetch
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'indent_booklets') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockIndentBooklets, error: null })
          })
        };
      }
      return supabase;
    });
    
    // Mock transactions data fetch
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: mockTransactions, error: null })
              })
            })
          })
        };
      }
      return supabase;
    });
  });

  it('fetches customer data successfully', async () => {
    const { result, rerender } = renderHook(() => useCustomerData(mockCustomerId));
    
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
