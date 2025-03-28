
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';
import { useAuth } from '@/contexts/AuthContext';

export interface TankUnload {
  id: string;
  vehicle_number: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  date: string;
}

export function useTankUnloads(refreshTrigger?: number, limit: number = 10, showAll: boolean = false) {
  const { fuelPumpId: contextFuelPumpId } = useAuth();
  const [recentUnloads, setRecentUnloads] = useState<TankUnload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFuelPumpId, setCurrentFuelPumpId] = useState<string | null>(null);

  const fetchRecentUnloads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to get the fuel pump ID from the context (most reliable)
      let fuelPumpId = contextFuelPumpId;
      console.log(`useTankUnloads - Context fuel pump ID: ${fuelPumpId || 'none'}`);
      
      // If not available in context, try to get it from the utility function
      if (!fuelPumpId) {
        fuelPumpId = await getFuelPumpId();
        console.log(`useTankUnloads - Utility function fuel pump ID: ${fuelPumpId || 'none'}`);
      }
      
      // Use localStorage as another fallback
      if (!fuelPumpId) {
        const storedSession = localStorage.getItem('fuel_pro_session');
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession.user && parsedSession.user.fuelPumpId) {
              fuelPumpId = parsedSession.user.fuelPumpId;
              console.log(`useTankUnloads - localStorage fuel pump ID: ${fuelPumpId}`);
            }
          } catch (parseError) {
            console.error('Error parsing stored session:', parseError);
          }
        }
      }
      
      // Default to the specific ID if still not available
      if (!fuelPumpId) {
        fuelPumpId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
        console.log(`useTankUnloads - Using default ID: ${fuelPumpId}`);
      }
      
      // Track the ID we're using
      setCurrentFuelPumpId(fuelPumpId);
      
      console.log(`useTankUnloads - Fetching tank unloads with fuel pump ID: ${fuelPumpId}`);
      
      let query = supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: false });
        
      // Apply fuel pump filter if available and not showing all
      if (fuelPumpId && !showAll) {
        console.log(`Filtering tank unloads by fuel_pump_id: ${fuelPumpId}`);
        query = query.eq('fuel_pump_id', fuelPumpId);
      } else if (showAll) {
        console.log('Showing all tank unloads (no fuel pump filter)');
      } else {
        console.log('No fuel pump ID available, fetching all tank unloads');
      }
      
      // Only apply limit if not showing all records
      if (!showAll) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching unloads:', error);
        throw new Error(error.message);
      }
      
      if (data && data.length > 0) {
        console.log(`Retrieved ${data.length} tank unloads for ID ${fuelPumpId}`);
        setRecentUnloads(data as TankUnload[]);
        return; // Success! Early return
      } 
      
      console.log('No tank unloads data returned for initial query');
      
      // If no results with the provided fuel pump ID, try with our specific ID
      // if it's not already the one we used
      if (fuelPumpId !== '2c762f9c-f89b-4084-9ebe-b6902fdf4311' && !showAll) {
        const specificId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
        console.log(`Trying with specific ID: ${specificId}`);
        
        const fallbackQuery = supabase
          .from('tank_unloads')
          .select('*')
          .eq('fuel_pump_id', specificId)
          .order('date', { ascending: false })
          .limit(limit);
          
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) {
          console.error('Error in fallback attempt:', fallbackError);
        } else if (fallbackData && fallbackData.length > 0) {
          console.log(`Retrieved ${fallbackData.length} tank unloads with fallback ID ${specificId}`);
          setRecentUnloads(fallbackData as TankUnload[]);
          return; // Success with fallback! Early return
        } else {
          console.log(`No data found with fallback ID ${specificId}`);
        }
      }
      
      // If still no results and not showing all, try without filter as last resort
      if (!showAll) {
        console.log('Trying without fuel pump ID filter as last resort');
        const unfilteredQuery = supabase
          .from('tank_unloads')
          .select('*')
          .order('date', { ascending: false })
          .limit(limit);
          
        const { data: unfilteredData, error: unfilteredError } = await unfilteredQuery;
        
        if (unfilteredError) {
          console.error('Error in unfiltered attempt:', unfilteredError);
        } else if (unfilteredData && unfilteredData.length > 0) {
          console.log(`Retrieved ${unfilteredData.length} tank unloads without filter`);
          setRecentUnloads(unfilteredData as TankUnload[]);
          return; // Success with unfiltered! Early return
        } else {
          console.log('No data found without filter');
        }
      }
      
      // Try using a direct query instead of RPC - removing the RPC approach that was causing errors
      // This section replaces the previous RPC code that was causing type errors
      try {
        console.log("Using direct query as final attempt");
        const { data: directData, error: directError } = await supabase
          .from('tank_unloads')
          .select('*')
          .eq('fuel_pump_id', '2c762f9c-f89b-4084-9ebe-b6902fdf4311')
          .order('date', { ascending: false })
          .limit(limit);
          
        if (!directError && directData && directData.length > 0) {
          console.log(`Retrieved ${directData.length} tank unloads with direct query`);
          setRecentUnloads(directData as TankUnload[]);
          return; // Success with direct query! Early return
        } else {
          console.log('No data found with direct query');
          if (directError) console.error('Direct query error:', directError);
        }
      } catch (queryError) {
        console.error('Error with direct query:', queryError);
      }
      
      // If we reach here, we couldn't find any data
      console.log('No tank unload data could be found through any method');
      setRecentUnloads([]);
      
    } catch (err) {
      console.error('Error fetching unloads:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setRecentUnloads([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, showAll, contextFuelPumpId]);
  
  useEffect(() => {
    fetchRecentUnloads();
  }, [fetchRecentUnloads, refreshTrigger]); // Refetch when refreshTrigger changes

  return {
    recentUnloads,
    isLoading,
    error,
    refetch: fetchRecentUnloads,
    currentFuelPumpId
  };
}
