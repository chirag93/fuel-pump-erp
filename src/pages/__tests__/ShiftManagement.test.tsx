
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShiftManagement from '@/pages/ShiftManagement';
import '@testing-library/jest-dom';
import { supabase } from '@/integrations/supabase/client';

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

// Mock useShiftManagement hook
jest.mock('@/hooks/useShiftManagement', () => ({
  useShiftManagement: () => ({
    shifts: [
      { 
        id: 'shift-1', 
        staff_id: 'staff-1',
        staff_name: 'John Doe',
        shift_type: 'day',
        start_time: '2023-08-15T08:00:00Z',
        end_time: null,
        status: 'active',
        date: '2023-08-15',
        pump_id: 'P001',
        opening_reading: 1000,
        closing_reading: null,
        starting_cash_balance: 5000,
        ending_cash_balance: null,
        card_sales: null,
        upi_sales: null,
        cash_sales: null,
        testing_fuel: null,
        created_at: '2023-08-15T08:00:00Z'
      },
      { 
        id: 'shift-2', 
        staff_id: 'staff-2',
        staff_name: 'Jane Smith',
        shift_type: 'night',
        start_time: '2023-08-14T20:00:00Z',
        end_time: '2023-08-15T08:00:00Z',
        status: 'completed',
        date: '2023-08-14',
        pump_id: 'P002',
        opening_reading: 2000,
        closing_reading: 2500,
        starting_cash_balance: 4000,
        ending_cash_balance: 3000,
        card_sales: 10000,
        upi_sales: 8000,
        cash_sales: 6000,
        testing_fuel: 2,
        created_at: '2023-08-14T20:00:00Z'
      }
    ],
    staffList: [
      { id: 'staff-1', name: 'John Doe' },
      { id: 'staff-2', name: 'Jane Smith' }
    ],
    isLoading: false,
    newShift: {
      date: '2023-08-15',
      start_time: '2023-08-15T08:00:00Z',
      staff_id: '',
      pump_id: '',
      opening_reading: 0,
      starting_cash_balance: 0,
      status: 'active',
      shift_type: 'day'
    },
    setNewShift: jest.fn(),
    fetchShifts: jest.fn(),
    handleAddShift: jest.fn().mockResolvedValue(true),
    activeShifts: [
      { 
        id: 'shift-1', 
        staff_id: 'staff-1',
        staff_name: 'John Doe',
        shift_type: 'day',
        start_time: '2023-08-15T08:00:00Z',
        end_time: null,
        status: 'active',
        date: '2023-08-15',
        pump_id: 'P001',
        opening_reading: 1000,
        closing_reading: null,
        starting_cash_balance: 5000,
        ending_cash_balance: null,
        card_sales: null,
        upi_sales: null,
        cash_sales: null,
        testing_fuel: null,
        created_at: '2023-08-15T08:00:00Z'
      }
    ],
    completedShifts: [
      { 
        id: 'shift-2', 
        staff_id: 'staff-2',
        staff_name: 'Jane Smith',
        shift_type: 'night',
        start_time: '2023-08-14T20:00:00Z',
        end_time: '2023-08-15T08:00:00Z',
        status: 'completed',
        date: '2023-08-14',
        pump_id: 'P002',
        opening_reading: 2000,
        closing_reading: 2500,
        starting_cash_balance: 4000,
        ending_cash_balance: 3000,
        card_sales: 10000,
        upi_sales: 8000,
        cash_sales: 6000,
        testing_fuel: 2,
        created_at: '2023-08-14T20:00:00Z'
      }
    ]
  })
}));

// Mock the dialog components
jest.mock('@/components/shift/StartShiftForm', () => ({
  StartShiftForm: ({ formOpen }) => (
    formOpen ? <div data-testid="start-shift-form">Start Shift Form Mock</div> : null
  )
}));

jest.mock('@/components/shift/ShiftSummaryCards', () => ({
  ShiftSummaryCards: () => <div data-testid="shift-summary-cards">Shift Summary Cards Mock</div>
}));

jest.mock('@/components/shift/ActiveShiftsTable', () => ({
  ActiveShiftsTable: () => <div data-testid="active-shifts-table">Active Shifts Table Mock</div>
}));

jest.mock('@/components/shift/CompletedShiftsTable', () => ({
  CompletedShiftsTable: () => <div data-testid="completed-shifts-table">Completed Shifts Table Mock</div>
}));

jest.mock('@/components/shift/EndShiftDialog', () => {
  return function MockEndShiftDialog() {
    return <div data-testid="end-shift-dialog">End Shift Dialog Mock</div>;
  };
});

jest.mock('@/components/shift/NewEndShiftDialog', () => ({
  NewEndShiftDialog: () => <div data-testid="new-end-shift-dialog">New End Shift Dialog Mock</div>
}));

describe('ShiftManagement Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the shift management page correctly', () => {
    render(<ShiftManagement />);
    
    expect(screen.getByText('Shift Management')).toBeInTheDocument();
    expect(screen.getByTestId('shift-summary-cards')).toBeInTheDocument();
    expect(screen.getByTestId('active-shifts-table')).toBeInTheDocument();
    
    // Click on the completed shifts tab
    const completedTab = screen.getByText('Completed Shifts');
    fireEvent.click(completedTab);
    
    expect(screen.getByTestId('completed-shifts-table')).toBeInTheDocument();
  });

  it('displays the start shift form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ShiftManagement />);
    
    // Find and click the start new shift button
    const startShiftButton = screen.getByText('Start New Shift');
    await user.click(startShiftButton);
    
    // The StartShiftForm dialog should be visible
    expect(screen.getByTestId('start-shift-form')).toBeInTheDocument();
  });

  // More tests would be added here for testing dialog interactions, etc.
  // These would be more meaningful with a real DOM implementation
});
