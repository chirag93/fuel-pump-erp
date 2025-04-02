
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { getFuelPumpById, getFuelPumpByEmail } from '@/integrations/fuelPumps';
import { supabase } from '@/integrations/supabase/client';

describe('Backend API Endpoints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementation
    vi.mocked(supabase.rpc).mockReturnValue({
      data: null,
      error: null
    } as any);
  });

  test('getFuelPumpById returns a fuel pump when found', async () => {
    // Mock the RPC call
    vi.mocked(supabase.rpc).mockReturnValue({
      data: [{
        id: 'test-id',
        name: 'Test Fuel Pump',
        email: 'test@example.com',
        status: 'active',
        created_at: '2023-01-01T00:00:00.000Z',
        address: 'Test Address',
        contact_number: '1234567890',
        created_by: null
      }],
      error: null
    } as any);

    const fuelPump = await getFuelPumpById('test-id');
    
    // Check results
    expect(fuelPump).not.toBeNull();
    expect(fuelPump?.name).toBe('Test Fuel Pump');
    expect(fuelPump?.email).toBe('test@example.com');
    
    // Verify supabase calls
    expect(supabase.rpc).toHaveBeenCalledWith('get_fuel_pump_by_id', { id_param: 'test-id' });
  });

  test('getFuelPumpById returns null when fuel pump is not found', async () => {
    // Mock empty response
    vi.mocked(supabase.rpc).mockReturnValue({
      data: [],
      error: null
    } as any);

    const fuelPump = await getFuelPumpById('non-existent-id');
    
    // Check results
    expect(fuelPump).toBeNull();
    
    // Verify supabase calls
    expect(supabase.rpc).toHaveBeenCalledWith('get_fuel_pump_by_id', { id_param: 'non-existent-id' });
  });

  test('getFuelPumpByEmail returns a fuel pump when found', async () => {
    // Mock the RPC call
    vi.mocked(supabase.rpc).mockReturnValue({
      data: [{
        id: 'test-id',
        name: 'Test Fuel Pump',
        email: 'test@example.com',
        status: 'active',
        created_at: '2023-01-01T00:00:00.000Z',
        address: 'Test Address',
        contact_number: '1234567890',
        created_by: null
      }],
      error: null
    } as any);

    const fuelPump = await getFuelPumpByEmail('test@example.com');
    
    // Check results
    expect(fuelPump).not.toBeNull();
    expect(fuelPump?.name).toBe('Test Fuel Pump');
    expect(fuelPump?.id).toBe('test-id');
    
    // Verify supabase calls
    expect(supabase.rpc).toHaveBeenCalledWith('get_fuel_pump_by_email', { email_param: 'test@example.com' });
  });

  test('getFuelPumpByEmail handles error from rpc call', async () => {
    // Mock error response
    vi.mocked(supabase.rpc).mockReturnValue({
      data: null,
      error: new Error('Database error')
    } as any);

    const fuelPump = await getFuelPumpByEmail('test@example.com');
    
    // Check results
    expect(fuelPump).toBeNull();
    
    // Verify supabase calls
    expect(supabase.rpc).toHaveBeenCalledWith('get_fuel_pump_by_email', { email_param: 'test@example.com' });
  });
});
