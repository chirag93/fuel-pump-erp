
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface TankUnload {
  id: string;
  vehicle_number: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  date: string;
}

export function useTankUnloads(refreshTrigger?: number, limit: number = 10, showAll: boolean = false) {
  const { fuelPumpId: contextFuelPumpId, isAuthenticated } = useAuth();
  const [recentUnloads, setRecentUnloads] = useState<TankUnload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecentUnloads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // If not authenticated, don't try to fetch data
    if (!isAuthenticated) {
      console.log('User is not authenticated. Please sign in to fetch data.');
      setIsLoading(false);
      setRecentUnloads([]);
      toast({
        title: "Authentication required",
        description: "Please sign in to view tank unload data",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First try to get the fuel pump ID from the context (most reliable)
      let fuelPumpId = contextFuelPumpId;
      console.log(`useTankUnloads - Context fuel pump ID: ${fuelPumpId || 'none'}`);
      
      // If not available in context, try to get it from the utility function
      if (!fuelPumpId) {
        fuelPumpId = await getFuelPumpId();
        console.log(`useTankUnloads - Utility function fuel pump ID: ${fuelPumpId || 'none'}`);
      }
      
      // Check if we have a fuel pump ID
      if (!fuelPumpId) {
        console.log('No fuel pump ID available for filtering data');
        setIsLoading(false);
        setRecentUnloads([]);
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view data",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`useTankUnloads - Fetching tank unloads with fuel pump ID: ${fuelPumpId}`);
      
      let query = supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: false });
        
      // Apply fuel pump filter
      console.log(`Filtering tank unloads by fuel_pump_id: ${fuelPumpId}`);
      query = query.eq('fuel_pump_id', fuelPumpId);
      
      // Only apply limit if not showing all records
      if (!showAll) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching unloads:', error);
        throw new Error(error.message);
      }
      
      if (data) {
        console.log(`Retrieved ${data.length} tank unloads for ID ${fuelPumpId}`);
        setRecentUnloads(data as TankUnload[]);
      } else {
        console.log('No tank unloads data returned');
        setRecentUnloads([]);
      }
    } catch (err) {
      console.error('Error fetching unloads:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setRecentUnloads([]);
      
      toast({
        title: "Error loading data",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [contextFuelPumpId, isAuthenticated, limit, showAll, refreshTrigger]);
  
  useEffect(() => {
    fetchRecentUnloads();
  }, [fetchRecentUnloads]);
  
  return { recentUnloads, isLoading, error, refetch: fetchRecentUnloads };
}
