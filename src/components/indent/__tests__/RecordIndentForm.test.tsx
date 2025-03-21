
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordIndent } from '@/pages/RecordIndent';
import '@testing-library/jest-dom';
import { supabase } from '@/integrations/supabase/client';
import userEvent from '@testing-library/user-event';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  }
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

// Mock crypto.randomUUID
global.crypto = {
  ...global.crypto,
  randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
};

describe('RecordIndent Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful staff fetch
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

  it('should render the record indent form', () => {
    render(<RecordIndent />);
    
    expect(screen.getByText('Record Indent')).toBeInTheDocument();
    expect(screen.getByText('Record New Indent')).toBeInTheDocument();
  });

  it('should handle customer and vehicle selection', async () => {
    // Mock customer data
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'staff') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [{ id: 'staff-1', name: 'John Doe' }],
          error: null
        };
      } else if (table === 'customers') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          data: [{ id: 'cust-1', name: 'Test Customer', contact: 'Contact', phone: '1234567890', email: 'test@example.com', gst: 'GST123' }],
          error: null
        };
      } else if (table === 'vehicles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          data: [{ id: 'veh-1', number: 'ABC123', type: 'Truck', capacity: '100L' }],
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

    render(<RecordIndent />);
    
    // Test will be expanded with user interactions when CustomerVehicleSelection component is available for testing
  });
});
