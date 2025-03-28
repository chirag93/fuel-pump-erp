
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';

export interface TankUnload {
  id: string;
  date: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  vehicle_number: string;
  created_at: string;
  fuel_pump_id: string;
}

export const useTankUnloads = (refreshTrigger = 0, limit = 5, showAll = false) => {
  const [recentUnloads, setRecentUnloads] = useState<TankUnload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnloads = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current fuel pump ID for data isolation
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available for fetching tank unloads');
          setError('Authentication required to view tank unloads');
          setRecentUnloads([]);
          return;
        }
        
        console.log(`Fetching tank unloads with fuel pump ID: ${fuelPumpId}, limit: ${limit}, showAll: ${showAll}`);
        
        // Create base query with fuel pump ID filter
        let query = supabase
          .from('tank_unloads')
          .select('*')
          .eq('fuel_pump_id', fuelPumpId)
          .order('date', { ascending: false });
          
        // Apply limit if not showing all
        if (!showAll) {
          query = query.limit(limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching tank unloads:', error);
          setError('Failed to load tank unload data');
          return;
        }
        
        if (data) {
          console.log(`Retrieved ${data.length} tank unloads for fuel pump ${fuelPumpId}`);
          setRecentUnloads(data as TankUnload[]);
        } else {
          console.log('No tank unloads found');
          setRecentUnloads([]);
        }
      } catch (err) {
        console.error('Exception in fetchUnloads:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnloads();
  }, [refreshTrigger, limit, showAll]);

  return { recentUnloads, isLoading, error };
};
