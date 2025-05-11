
import { render, screen, waitFor, within, fireEvent } from '../utils/test-utils';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import FuelTests from '@/pages/FuelTests';
import { supabase } from '@/integrations/supabase/client';

// Mock necessary functions and modules
vi.mock('@/integrations/utils', () => ({
  getFuelPumpId: vi.fn().mockResolvedValue('test-fuel-pump-id')
}));

describe('FuelTests Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock the supabase responses
    const mockFromImplementation = (table: string) => {
      if (table === 'fuel_tests') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          data: [
            {
              id: '1',
              fuel_type: 'petrol',
              test_date: '2023-06-10',
              test_time: '10:00:00',
              temperature: 25,
              density: 0.78,
              appearance: 'Normal',
              litres_tested: 1,
              notes: 'Test note',
              tested_by: 'staff-id',
              staff: { name: 'Test Staff' }
            }
          ],
          error: null
        };
      }
      
      if (table === 'staff') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          data: { id: 'staff-id' },
          error: null
        };
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        error: null
      };
    };

    vi.mocked(supabase.from).mockImplementation(mockFromImplementation as any);
  });

  test('renders fuel tests page with initial content', async () => {
    render(<FuelTests />);
    
    // Check for basic content
    expect(screen.getByText('Fuel Tests')).toBeInTheDocument();
    expect(screen.getByText('Manage and record fuel quality tests')).toBeInTheDocument();
    
    // Check for tab presence
    expect(screen.getByRole('tab', { name: 'New Test' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Test History' })).toBeInTheDocument();
    
    // New Test tab should be active by default and show the form
    expect(screen.getByText('Record New Fuel Test')).toBeInTheDocument();
  });
  
  test('switches to test history tab when clicked', async () => {
    const user = userEvent.setup();
    render(<FuelTests />);
    
    // First verify we're on the new test tab
    expect(screen.getByText('Record New Fuel Test')).toBeInTheDocument();
    
    // Find and click the history tab
    const historyTab = screen.getByRole('tab', { name: 'Test History' });
    await user.click(historyTab);
    
    // Verify we're showing the history view
    await waitFor(() => {
      expect(screen.getByText('Test History')).toBeInTheDocument();
      expect(screen.getByText('Review past fuel quality tests')).toBeInTheDocument();
    });
    
    // Verify test data is shown
    expect(screen.getByText('Test Staff')).toBeInTheDocument();
  });

  test('allows submitting a new fuel test', async () => {
    const user = userEvent.setup();
    
    // Mock insert function to return success
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'fuel_tests') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          data: [{ id: 'new-test-id' }],
          error: null
        } as any;
      }
      return vi.mocked(supabase.from)(table);
    });
    
    render(<FuelTests />);
    
    // Select a mock date - this mock is simplified in setupTests.ts
    const datePicker = screen.getByTestId('mock-date-picker');
    // Skip direct interaction with the mocked component
    
    // Select fuel type (using a workaround for shadcn select)
    // We'll directly call the onChange handler since UI interaction is difficult
    const fuelTypeField = screen.getByLabelText('Fuel Type');
    fireEvent.change(fuelTypeField, { target: { value: 'diesel' } });
    
    // Select test type with same approach
    const testTypeField = screen.getByLabelText('Test Type');
    fireEvent.change(testTypeField, { target: { value: 'density' } });
    
    // Enter test result (this should work with regular input)
    const resultField = screen.getByLabelText('Test Result');
    await user.type(resultField, '0.85');
    
    // Enter remarks
    const remarksField = screen.getByLabelText('Remarks');
    await user.type(remarksField, 'Test remarks');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /record test/i });
    await user.click(submitButton);
    
    // Verify Supabase was called to insert a record
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('fuel_tests');
    });
  });
});
