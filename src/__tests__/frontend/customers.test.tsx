
import { render, screen, waitFor } from '../utils/test-utils';
import { vi } from 'vitest';
import Customers from '@/pages/Customers';
import { supabase } from '@/integrations/supabase/client';

// Mock getFuelPumpId function
vi.mock('@/integrations/utils', () => ({
  getFuelPumpId: vi.fn().mockResolvedValue('test-fuel-pump-id')
}));

describe('Customers Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Mock supabase select query for customers
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback => {
        return Promise.resolve(callback({ 
          data: [
            { 
              id: '1', 
              name: 'Test Customer', 
              contact: 'Test Contact',
              phone: '1234567890',
              email: 'test@example.com',
              gst: 'GST123456',
              balance: 1000 
            }
          ], 
          error: null 
        }));
      })
    } as any);
  });

  test('renders customer list when data is loaded', async () => {
    render(<Customers />);
    
    // Check loading state first
    expect(screen.getByText(/loading customers/i)).toBeInTheDocument();
    
    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });
    
    // Check if other customer data is rendered
    expect(screen.getByText('Test Contact')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('GST123456')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
  });

  test('shows empty state when no customers are found', async () => {
    // Override mock for this specific test to return no customers
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback => {
        return Promise.resolve(callback({ data: [], error: null }));
      })
    } as any);
    
    render(<Customers />);
    
    await waitFor(() => {
      expect(screen.getByText(/no customers yet/i)).toBeInTheDocument();
    });
  });

  test('filters customers when search term is entered', async () => {
    render(<Customers />);
    
    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });
    
    // Get search input and enter search term
    const searchInput = screen.getByPlaceholderText(/search customers/i) as HTMLInputElement;
    searchInput.focus();
    searchInput.value = 'Unknown';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Check that "No customers found" message appears
    await waitFor(() => {
      expect(screen.getByText(/no customers found matching your search/i)).toBeInTheDocument();
    });
  });
});
