
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { getAllCustomers, getCustomerById, createCustomer, updateCustomer } from '@/integrations/customers';
import { supabase } from '@/integrations/supabase/client';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

// Mock getFuelPumpId utility
vi.mock('@/integrations/utils', () => ({
  getFuelPumpId: vi.fn().mockResolvedValue('test-fuel-pump-id')
}));

describe('Customer Integration Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('getAllCustomers fetches customers for a fuel pump', async () => {
    // Setup mock response
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
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
    } as any);

    const customers = await getAllCustomers();
    
    // Check results
    expect(customers).toHaveLength(1);
    expect(customers[0].name).toBe('Test Customer');
    
    // Verify supabase calls
    expect(supabase.from).toHaveBeenCalledWith('customers');
  });

  test('getCustomerById fetches a single customer', async () => {
    // Setup mock response
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      data: { 
        id: '1', 
        name: 'Test Customer', 
        contact: 'Test Contact',
        phone: '1234567890',
        email: 'test@example.com',
        gst: 'GST123456',
        balance: 1000 
      },
      error: null
    } as any);

    const customer = await getCustomerById('1');
    
    // Check results
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe('Test Customer');
    
    // Verify supabase calls
    expect(supabase.from).toHaveBeenCalledWith('customers');
  });

  test('createCustomer adds a new customer', async () => {
    // Setup mock response
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      data: { 
        id: '1', 
        name: 'New Customer', 
        contact: 'New Contact',
        phone: '9876543210',
        email: 'new@example.com',
        gst: 'GST654321',
        balance: 0 
      },
      error: null
    } as any);

    const newCustomerData = {
      name: 'New Customer',
      contact: 'New Contact',
      phone: '9876543210',
      email: 'new@example.com',
      gst: 'GST654321'
    };

    const customer = await createCustomer(newCustomerData);
    
    // Check results
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe('New Customer');
    
    // Verify supabase calls
    expect(supabase.from).toHaveBeenCalledWith('customers');
  });

  test('updateCustomer modifies an existing customer', async () => {
    // Setup mock response
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      data: { 
        id: '1', 
        name: 'Updated Customer', 
        contact: 'Updated Contact',
        phone: '1234567890',
        email: 'updated@example.com',
        gst: 'GST123456',
        balance: 1500 
      },
      error: null
    } as any);

    const updateData = {
      name: 'Updated Customer',
      contact: 'Updated Contact',
      email: 'updated@example.com',
      balance: 1500
    };

    const customer = await updateCustomer('1', updateData);
    
    // Check results
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe('Updated Customer');
    expect(customer?.balance).toBe(1500);
    
    // Verify supabase calls
    expect(supabase.from).toHaveBeenCalledWith('customers');
  });

  test('handles error when getFuelPumpId returns null', async () => {
    // Mock getFuelPumpId to return null
    vi.mocked(require('@/integrations/utils').getFuelPumpId).mockResolvedValue(null);
    
    const customers = await getAllCustomers();
    
    // Should return empty array when no fuel pump ID
    expect(customers).toHaveLength(0);
  });
});
