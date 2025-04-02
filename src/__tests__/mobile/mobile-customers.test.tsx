
import { render, screen, waitFor, fireEvent } from '../utils/test-utils';
import { vi } from 'vitest';
import MobileCustomers from '@/pages/mobile/MobileCustomers';
import { supabase } from '@/integrations/supabase/client';

// Mock necessary functions and modules
vi.mock('@/integrations/utils', () => ({
  getFuelPumpId: vi.fn().mockResolvedValue('test-fuel-pump-id')
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children }) => <a href={to}>{children}</a>
  };
});

describe('MobileCustomers Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock supabase query for customers
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      data: [
        {
          id: '1',
          name: 'Test Mobile Customer',
          phone: '9876543210',
          address: 'Test Address',
          balance: 5000
        },
        {
          id: '2',
          name: 'Another Customer',
          phone: '1234567890',
          address: null,
          balance: 0
        }
      ],
      error: null
    } as any);
  });

  test('renders customer list in mobile view', async () => {
    render(<MobileCustomers />);
    
    // Check for loading state
    expect(screen.getByText(/loading customers/i)).toBeInTheDocument();
    
    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Test Mobile Customer')).toBeInTheDocument();
      expect(screen.getByText('Another Customer')).toBeInTheDocument();
    });
    
    // Check customer details are displayed
    expect(screen.getByText('9876543210')).toBeInTheDocument();
    expect(screen.getByText('Test Address')).toBeInTheDocument();
    expect(screen.getByText('₹5,000')).toBeInTheDocument();
  });

  test('filters customers when search term is entered', async () => {
    render(<MobileCustomers />);
    
    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Test Mobile Customer')).toBeInTheDocument();
    });
    
    // Search for a customer
    const searchInput = screen.getByPlaceholderText(/search by name or phone/i);
    fireEvent.change(searchInput, { target: { value: 'Another' } });
    
    // Check that only matching customer is shown
    expect(screen.getByText('Another Customer')).toBeInTheDocument();
    expect(screen.queryByText('Test Mobile Customer')).not.toBeInTheDocument();
  });

  test('shows empty state when no customers match search', async () => {
    render(<MobileCustomers />);
    
    // Wait for customers to load
    await waitFor(() => {
      expect(screen.getByText('Test Mobile Customer')).toBeInTheDocument();
    });
    
    // Search for a non-existent customer
    const searchInput = screen.getByPlaceholderText(/search by name or phone/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    // Check empty state is shown
    expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
  });
});
