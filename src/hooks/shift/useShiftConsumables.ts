
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AllocatedConsumable, ReturnedConsumablesMap } from '@/components/shift/EndShiftConsumables';

export function useShiftConsumables(shiftId: string) {
  const [allocatedConsumables, setAllocatedConsumables] = useState<AllocatedConsumable[]>([]);
  const [returnedConsumables, setReturnedConsumables] = useState<ReturnedConsumablesMap>({});
  const [consumablesExpense, setConsumablesExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load consumables allocated to this shift
  useEffect(() => {
    const loadConsumables = async () => {
      if (!shiftId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('shift_consumables')
          .select(`
            id,
            quantity_allocated,
            quantity_returned,
            consumable_id,
            consumables (
              name,
              price_per_unit,
              unit
            )
          `)
          .eq('shift_id', shiftId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log('Found consumables for this shift:', data);
          
          const formattedConsumables: AllocatedConsumable[] = data.map(item => ({
            id: item.id,
            name: item.consumables?.name || 'Unknown Item',
            quantity_allocated: item.quantity_allocated || 0,
            quantity_returned: item.quantity_returned || 0,
            price_per_unit: item.consumables?.price_per_unit || 0,
            unit: item.consumables?.unit || 'unit'
          }));
          
          setAllocatedConsumables(formattedConsumables);
          
          // Initialize returned consumables state
          const returnedMap: ReturnedConsumablesMap = {};
          formattedConsumables.forEach(item => {
            returnedMap[item.id] = item.quantity_returned || 0;
          });
          
          setReturnedConsumables(returnedMap);
          
          // Calculate consumable expenses
          calculateConsumableExpenses(formattedConsumables, returnedMap);
        } else {
          console.log('No consumables allocated to this shift');
          setAllocatedConsumables([]);
        }
      } catch (err) {
        console.error('Error loading shift consumables:', err);
        setError('Failed to load consumables data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConsumables();
  }, [shiftId]);

  // Calculate consumable expenses
  const calculateConsumableExpenses = (
    consumables: AllocatedConsumable[], 
    returned: ReturnedConsumablesMap
  ) => {
    const expenses = consumables.reduce((total, item) => {
      const consumed = item.quantity_allocated - (returned[item.id] || 0);
      return total + (consumed * (item.price_per_unit || 0));
    }, 0);
    
    setConsumablesExpense(expenses);
  };

  // Update returned consumable quantity
  const updateReturnedConsumable = (id: string, quantity: number) => {
    const updatedReturned = {
      ...returnedConsumables,
      [id]: quantity
    };
    
    setReturnedConsumables(updatedReturned);
    calculateConsumableExpenses(allocatedConsumables, updatedReturned);
  };

  return {
    allocatedConsumables,
    returnedConsumables,
    consumablesExpense,
    isLoading,
    error,
    updateReturnedConsumable
  };
}
