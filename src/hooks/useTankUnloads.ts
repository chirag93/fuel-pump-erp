
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

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
      let query = supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: false });
        
      // Only apply limit if not showing all records
      if (!showAll) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
        
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        setRecentUnloads(data as TankUnload[]);
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
