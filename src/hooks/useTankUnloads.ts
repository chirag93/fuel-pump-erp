
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';

export interface TankUnload {
  id: string;
  vehicle_number: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  date: string;
}

export function useTankUnloads(refreshTrigger?: number, limit: number = 10, showAll: boolean = false) {
  const [recentUnloads, setRecentUnloads] = useState<TankUnload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecentUnloads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fuelPumpId = await getFuelPumpId();
      console.log(`Fetching tank unloads with fuel pump ID: ${fuelPumpId || 'none'}`);
      
      let query = supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: false });
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        console.log(`Filtering tank unloads by fuel_pump_id: ${fuelPumpId}`);
        query = query.eq('fuel_pump_id', fuelPumpId);
      } else {
        console.log('No fuel pump ID available, attempting to fetch first available fuel pump');
        
        // If no fuel pump ID, try to get the first one from the database as fallback
        const { data: firstPump } = await supabase
          .from('fuel_pumps')
          .select('id')
          .limit(1)
          .single();
          
        if (firstPump?.id) {
          console.log(`Fallback: Using first fuel pump ID: ${firstPump.id}`);
          query = query.eq('fuel_pump_id', firstPump.id);
        } else {
          console.log('No fuel pumps found in database, fetching all records');
        }
      }
      
      // Only apply limit if not showing all records
      if (!showAll) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
        
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        console.log(`Retrieved ${data.length} tank unloads`);
        setRecentUnloads(data as TankUnload[]);
      } else {
        console.log('No tank unloads data returned');
        setRecentUnloads([]);
      }
    } catch (err) {
      console.error('Error fetching unloads:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, showAll]);
  
  useEffect(() => {
    fetchRecentUnloads();
  }, [fetchRecentUnloads, refreshTrigger]); // Refetch when refreshTrigger changes

  return {
    recentUnloads,
    isLoading,
    error,
    refetch: fetchRecentUnloads
  };
}
