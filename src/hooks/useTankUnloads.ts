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
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);

  const fetchRecentUnloads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get or create a fuel pump ID
      const pumpId = fuelPumpId || await getFuelPumpId();
      console.log(`Fetching tank unloads with fuel pump ID: ${pumpId || 'none'}`);
      setFuelPumpId(pumpId);
      
      if (!pumpId) {
        console.log('No fuel pump ID available, retrying with getFuelPumpId');
        const retryPumpId = await getFuelPumpId();
        
        if (!retryPumpId) {
          console.log('Still no fuel pump ID, using sample data');
          const sampleData = getSampleData();
          setRecentUnloads(sampleData);
          setIsLoading(false);
          return;
        }
        
        setFuelPumpId(retryPumpId);
      }
      
      let query = supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: false });
        
      // Apply fuel pump filter if available
      if (pumpId) {
        console.log(`Filtering tank unloads by fuel_pump_id: ${pumpId}`);
        query = query.eq('fuel_pump_id', pumpId);
      }
      
      // Only apply limit if not showing all records
      if (!showAll) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
        
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        console.log(`Retrieved ${data.length} tank unloads`);
        setRecentUnloads(data as TankUnload[]);
      } else {
        console.log('No tank unloads data returned');
        
        // If we have an empty result with a valid fuel pump ID, show empty list
        if (pumpId) {
          setRecentUnloads([]);
        } else {
          // Otherwise, show sample data for demonstration
          const sampleData = getSampleData();
          setRecentUnloads(sampleData);
        }
      }
    } catch (err) {
      console.error('Error fetching unloads:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      
      // Set fallback sample data
      const sampleData = getSampleData();
      setRecentUnloads(sampleData);
    } finally {
      setIsLoading(false);
    }
  }, [limit, showAll, fuelPumpId]);
  
  // Helper function to generate sample data
  const getSampleData = (): TankUnload[] => {
    return [
      {
        id: 'sample-1',
        vehicle_number: 'TN01AB1234',
        fuel_type: 'Petrol',
        quantity: 5000,
        amount: 500000,
        date: new Date().toISOString()
      },
      {
        id: 'sample-2',
        vehicle_number: 'TN02CD5678',
        fuel_type: 'Diesel',
        quantity: 8000,
        amount: 720000,
        date: new Date(Date.now() - 86400000).toISOString() // Yesterday
      }
    ];
  };
  
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
