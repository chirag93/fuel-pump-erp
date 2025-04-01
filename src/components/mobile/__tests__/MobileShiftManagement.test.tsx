
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileShiftManagement from '@/pages/mobile/MobileShiftManagement';
import { renderWithProviders, setMobileMode } from '@/test-utils/test-helpers';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useShiftManagement hook
vi.mock('@/hooks/useShiftManagement', () => ({
  useShiftManagement: vi.fn(() => ({
    staffList: [
      { id: 'staff-1', name: 'John Doe' },
      { id: 'staff-2', name: 'Jane Smith' }
    ],
    activeShifts: [
      {
        id: 'shift-1',
        staff_id: 'staff-1',
        staff_name: 'John Doe',
        pump_id: 'P001',
        date: '2023-08-15',
        opening_reading: 1000,
        starting_cash_balance: 500,
        start_time: '2023-08-15T08:00:00Z'
      }
    ],
    newShift: {
      staff_id: '',
      pump_id: '',
      date: '2023-08-15',
      opening_reading: 0,
      starting_cash_balance: 0
    },
    setNewShift: vi.fn(),
    handleAddShift: vi.fn().mockResolvedValue(true),
    isLoading: false,
    fetchShifts: vi.fn()
  }))
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

describe('MobileShiftManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMobileMode(true);
  });

  it('renders the mobile shift management page', async () => {
    renderWithProviders(<MobileShiftManagement />, { isAuthenticated: true });
    
    // Check page title
    expect(screen.getByText('Shift Management')).toBeInTheDocument();
    
    // Check start new shift section
    expect(screen.getByText('Start New Shift')).toBeInTheDocument();
    expect(screen.getByText('Record shift details including staff and opening cash amount.')).toBeInTheDocument();
    
    // Check active shifts section
    expect(screen.getByText('Active Shifts')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('End Shift')).toBeInTheDocument();
  });

  // Additional tests would be added for comprehensive coverage
});
