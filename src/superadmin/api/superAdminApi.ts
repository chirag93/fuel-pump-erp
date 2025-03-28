
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';
import { FuelPump } from '@/integrations/fuelPumps';

// Centralized API functions for super admin features
export const superAdminApi = {
  // Check if a user has super admin access
  async checkSuperAdminAccess(token: string): Promise<boolean> {
    try {
      // Special case for hardcoded admin token - don't query the database
      if (token && token.startsWith('sa-')) {
        return true;
      }
      
      // Only query the database if we have a UUID format token
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (token && uuidRegex.test(token)) {
        const { data: superAdmins, error } = await supabase
          .from('super_admins')
          .select('id')
          .eq('id', token)
          .maybeSingle();
          
        return !error && !!superAdmins;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking super admin access:', error);
      return false;
    }
  },
  
  // Create a new fuel pump
  async provisionFuelPump(fuelPumpData: Partial<FuelPump>, password: string): Promise<{
    success: boolean;
    error?: string;
    fuelPump?: FuelPump;
  }> {
    try {
      // First check if a fuel pump with this email already exists
      const { data: existingPump } = await supabase
        .from('fuel_pumps')
        .select('id')
        .ilike('email', fuelPumpData.email || '')
        .maybeSingle();
        
      if (existingPump) {
        return {
          success: false,
          error: 'A fuel pump with this email already exists'
        };
      }
      
      // 1. Create the fuel pump record
      const { data: newPump, error: pumpError } = await supabase
        .from('fuel_pumps')
        .insert([{
          name: fuelPumpData.name,
          email: fuelPumpData.email,
          address: fuelPumpData.address,
          contact_number: fuelPumpData.contact_number,
          status: 'active',
          created_by: fuelPumpData.created_by
        }])
        .select()
        .single();
        
      if (pumpError) {
        throw new Error(pumpError.message);
      }
      
      // 2. Create the user account via the backend API
      const apiUrl = `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/admin-reset-password`;
      
      const response = await axios.post(apiUrl, {
        email: fuelPumpData.email,
        newPassword: password
      });
      
      if (!response.data.success) {
        // Rollback the fuel pump creation
        await supabase
          .from('fuel_pumps')
          .delete()
          .eq('id', newPump.id);
          
        throw new Error(response.data.error || 'Failed to create user account');
      }
      
      // 3. Initialize default settings for this pump
      await this.initializeDefaultSettings(newPump.id);
      
      return {
        success: true,
        fuelPump: newPump
      };
    } catch (error: any) {
      console.error('Error provisioning fuel pump:', error);
      return {
        success: false,
        error: error.message || 'Failed to provision fuel pump'
      };
    }
  },
  
  // Initialize default settings for a new fuel pump
  async initializeDefaultSettings(fuelPumpId: string): Promise<void> {
    try {
      // Initialize default fuel settings
      await supabase
        .from('fuel_settings')
        .insert([
          {
            fuel_type: 'Petrol',
            current_price: 87.50,
            tank_capacity: 10000,
            current_level: 5000,
            fuel_pump_id: fuelPumpId
          },
          {
            fuel_type: 'Diesel',
            current_price: 85.20,
            tank_capacity: 10000,
            current_level: 5000,
            fuel_pump_id: fuelPumpId
          }
        ]);
      
      // Initialize default pump settings
      await supabase
        .from('pump_settings')
        .insert([
          {
            pump_number: '1',
            nozzle_count: 2,
            fuel_types: ['Petrol', 'Diesel'],
            fuel_pump_id: fuelPumpId
          }
        ]);
    } catch (error) {
      console.error('Error initializing default settings:', error);
      // Continue anyway as this is not critical
    }
  },
  
  // Reset a fuel pump user's password
  async resetFuelPumpPassword(email: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const apiUrl = `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/admin-reset-password`;
      
      const response = await axios.post(apiUrl, {
        email,
        newPassword
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to reset password');
      }
      
      // Update the fuel pump status
      await supabase
        .from('fuel_pumps')
        .update({ status: 'password_change_required' })
        .eq('email', email);
      
      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password'
      };
    }
  },
  
  // Get all fuel pumps
  async getAllFuelPumps(): Promise<FuelPump[]> {
    try {
      const { data, error } = await supabase
        .from('fuel_pumps')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching fuel pumps:', error);
      return [];
    }
  }
};
