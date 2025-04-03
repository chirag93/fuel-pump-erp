
import { render, screen, waitFor } from '../utils/test-utils';
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
    
    // Mock supabase query for fuel tests
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'fuel_tests') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
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
        } as any;
      }
      
      if (table === 'staff') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          data: { id: 'staff-id' },
          error: null
        } as any;
      }
      
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        error: null
      } as any;
    });
    
    // Mock supabase insert for new tests
    vi.mocked(supabase.from).mockReturnValue({
      ...vi.mocked(supabase.from)(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      error: null
    } as any);
  });

  test('renders fuel tests page with tabs', async () => {
    render(<FuelTests />);
    
    // Check for tab presence
    expect(screen.getByText('New Test')).toBeInTheDocument();
    expect(screen.getByText('Test History')).toBeInTheDocument();
    
    // New Test tab should be active by default
    expect(screen.getByText('Record New Fuel Test')).toBeInTheDocument();
  });
  
  test('displays test history when tab is clicked', async () => {
    const user = userEvent.setup();
    render(<FuelTests />);
    
    // Click on Test History tab using userEvent
    const testHistoryTab = screen.getByRole('tab', { name: 'Test History' });
    await user.click(testHistoryTab);
    
    // Check for test history content
    await waitFor(() => {
      expect(screen.getByText('Test History')).toBeInTheDocument();
      expect(screen.getByText('Review past fuel quality tests')).toBeInTheDocument();
    });
    
    // Check for test data
    expect(screen.getByText('Petrol')).toBeInTheDocument();
    expect(screen.getByText('Density')).toBeInTheDocument();
    expect(screen.getByText('0.78')).toBeInTheDocument();
    expect(screen.getByText('Test Staff')).toBeInTheDocument();
  });

  test('submits new test when form is filled out', async () => {
    const user = userEvent.setup();
    render(<FuelTests />);
    
    // Fill out form fields
    // Select fuel type
    const fuelTypeSelect = screen.getAllByRole('combobox')[0];
    await user.click(fuelTypeSelect);
    await user.click(screen.getByText('Diesel'));
    
    // Select test type
    const testTypeSelect = screen.getAllByRole('combobox')[1];
    await user.click(testTypeSelect);
    await user.click(screen.getByText('Density Test'));
    
    // Enter test result
    const testResultInput = screen.getByLabelText('Test Result');
    await user.type(testResultInput, '0.85');
    
    // Enter remarks
    const remarksInput = screen.getByLabelText('Remarks');
    await user.type(remarksInput, 'Test remarks');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Record Test' });
    await user.click(submitButton);
    
    // Check that form submission was attempted
    expect(supabase.from).toHaveBeenCalledWith('fuel_tests');
  });
});
