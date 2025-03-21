
import { renderHook, act, waitFor } from '@testing-library/react';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn()
}));

describe('useShiftManagement Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock staff data
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'staff') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            { id: 'staff-1', name: 'John Doe' },
            { id: 'staff-2', name: 'Jane Smith' }
          ],
          error: null
        };
      } else if (table === 'shifts') {
        return {
          select: jest.fn().mockReturnThis(),
          data: [
            { 
              id: 'shift-1', 
              staff_id: 'staff-1',
              shift_type: 'day',
              start_time: '2023-08-15T08:00:00Z',
              end_time: null,
              status: 'active',
              created_at: '2023-08-15T08:00:00Z'
            },
            { 
              id: 'shift-2', 
              staff_id: 'staff-2',
              shift_type: 'night',
              start_time: '2023-08-14T20:00:00Z',
              end_time: '2023-08-15T08:00:00Z',
              status: 'completed',
              created_at: '2023-08-14T20:00:00Z'
            }
          ],
          error: null
        };
      } else if (table === 'readings') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          data: {
            date: '2023-08-15',
            pump_id: 'P001',
            opening_reading: 1000,
            closing_reading: null,
            cash_given: 5000,
            cash_remaining: null,
            card_sales: null,
            upi_sales: null,
            cash_sales: null,
            testing_fuel: null
          },
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

  it('should load staff and shifts data on mount', async () => {
    const { result } = renderHook(() => useShiftManagement());
    
    // Wait for the async operations to complete
    await waitFor(() => {
      expect(result.current.staffList.length).toBe(2);
      expect(result.current.shifts.length).toBe(2);
      expect(result.current.activeShifts.length).toBe(1);
      expect(result.current.completedShifts.length).toBe(1);
    });
  });

  it('should handle adding a new shift', async () => {
    // Setup mock responses for handleAddShift
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'shifts') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              data: [{ 
                id: 'new-shift-1', 
                staff_id: 'staff-1',
                shift_type: 'day',
                start_time: '2023-08-16T08:00:00Z',
                status: 'active'
              }],
              error: null
            })
          }),
          select: jest.fn().mockReturnThis(),
          data: [],
          error: null
        };
      } else if (table === 'readings') {
        return {
          insert: jest.fn().mockReturnValue({
            error: null
          }),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          data: null,
          error: null
        };
      } else if (table === 'staff') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [
            { id: 'staff-1', name: 'John Doe' },
            { id: 'staff-2', name: 'Jane Smith' }
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
    
    const { result } = renderHook(() => useShiftManagement());
    
    // Set up the new shift data
    await act(async () => {
      result.current.setNewShift({
        date: '2023-08-16',
        start_time: '2023-08-16T08:00:00Z',
        staff_id: 'staff-1',
        pump_id: 'P001',
        opening_reading: 1000,
        starting_cash_balance: 5000,
        status: 'active',
        shift_type: 'day'
      });
    });
    
    // Call handleAddShift
    let success;
    await act(async () => {
      success = await result.current.handleAddShift();
    });
    
    // Verify the result
    expect(success).toBe(true);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Success",
      description: "New shift started successfully"
    }));
  });

  // Add more tests for other functionality as needed
});
