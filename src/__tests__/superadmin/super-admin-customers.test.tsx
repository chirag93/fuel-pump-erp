
import { render, screen } from '../utils/test-utils';
import { vi } from 'vitest';
import SuperAdminCustomers from '@/superadmin/pages/SuperAdminCustomers';

describe('SuperAdminCustomers Component', () => {
  test('renders the SuperAdminCustomers page', () => {
    render(<SuperAdminCustomers />);
    
    // Check for basic elements
    expect(screen.getByText('Customer Management')).toBeInTheDocument();
    expect(screen.getByText('View and manage all customers across fuel pumps.')).toBeInTheDocument();
  });
});
