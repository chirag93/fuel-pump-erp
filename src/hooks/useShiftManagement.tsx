
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Shift, Staff } from '@/types/shift';
import { SelectedConsumable } from '@/components/shift/StartShiftForm';
import { getFuelPumpId } from '@/integrations/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useShiftManagement() {
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    date: new Date().toISOString().split('T')[0],
    start_time: new Date().toISOString(),
    staff_id: '',
    pump_id: '',
    opening_reading: 0,
    starting_cash_balance: 0,
    status: 'active',
    shift_type: 'day'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get fuel pump ID once and store it
  const { data: fuelPumpId, isLoading: isLoadingPumpId } = useQuery({
    queryKey: ['fuelPumpId'],
    queryFn: getFuelPumpId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1
  });
  
  // Fetch staff list for the current fuel pump
  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staffList', fuelPumpId],
    queryFn: async () => {
      if (!fuelPumpId) return [];
      
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, staff_numeric_id, role')
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch all shifts with related data in a single query
  const { data: shifts = [], isLoading: isLoadingShifts, refetch: fetchShifts } = useQuery({
    queryKey: ['shifts', fuelPumpId],
    queryFn: async () => {
      if (!fuelPumpId) return [];
      
      // First, get shifts data
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          id,
          staff_id,
          shift_type,
          start_time,
          end_time,
          status,
          created_at,
          staff:staff_id (name, staff_numeric_id),
          readings:readings (
            date, 
            pump_id, 
            opening_reading, 
            closing_reading, 
            cash_given, 
            cash_remaining, 
            card_sales, 
            upi_sales, 
            cash_sales, 
            testing_fuel
          )
        `)
        .eq('fuel_pump_id', fuelPumpId)
        .order('created_at', { ascending: false })
        .limit(100); // Pagination - limit to most recent 100 shifts
        
      if (shiftsError) {
        throw shiftsError;
      }
      
      if (!shiftsData) {
        return [];
      }
      
      // Process the joined data
      const processedShifts = shiftsData.map(shift => {
        const readings = shift.readings && shift.readings.length > 0 ? shift.readings[0] : {};
        const staffData = shift.staff || { name: 'Unknown Staff', staff_numeric_id: null };
        
        return {
          ...shift,
          staff_name: staffData.name,
          staff_numeric_id: staffData.staff_numeric_id,
          date: readings.date || new Date().toISOString().split('T')[0],
          pump_id: readings.pump_id || 'Unknown',
          opening_reading: readings.opening_reading || 0,
          closing_reading: readings.closing_reading || null,
          starting_cash_balance: readings.cash_given || 0,
          ending_cash_balance: readings.cash_remaining || null,
          card_sales: readings.card_sales || null,
          upi_sales: readings.upi_sales || null,
          cash_sales: readings.cash_sales || null,
          testing_fuel: readings.testing_fuel || null,
          fuel_pump_id: fuelPumpId
        } as Shift;
      });
      
      return processedShifts;
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60, // 1 minute cache
    refetchInterval: 1000 * 60 * 5, // Background refresh every 5 minutes
  });
  
  // Add a new shift with mutation
  const addShiftMutation = useMutation({
    mutationFn: async (data: { newShift: Partial<Shift>, selectedConsumables: SelectedConsumable[] }) => {
      const { newShift, selectedConsumables = [] } = data;
      
      if (!fuelPumpId) {
        throw new Error("Authentication Required");
      }
      
      if (!newShift.staff_id || !newShift.pump_id || !newShift.opening_reading) {
        throw new Error("Missing information");
      }
      
      const staffName = staffList.find(s => s.id === newShift.staff_id)?.name || 'Unknown Staff';
      
      // 1. Create shift record
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .insert([{
          staff_id: newShift.staff_id,
          shift_type: newShift.shift_type || 'day',
          start_time: new Date().toISOString(),
          status: 'active',
          fuel_pump_id: fuelPumpId
        }])
        .select();
        
      if (shiftError) {
        throw shiftError;
      }
      
      if (!shiftData || shiftData.length === 0) {
        throw new Error("Failed to create shift record");
      }
      
      // 2. Create reading record
      const { error: readingError } = await supabase
        .from('readings')
        .insert([{
          shift_id: shiftData[0].id,
          staff_id: newShift.staff_id,
          pump_id: newShift.pump_id,
          date: newShift.date,
          opening_reading: newShift.opening_reading,
          closing_reading: null,
          cash_given: newShift.starting_cash_balance || 0,
          fuel_pump_id: fuelPumpId
        }]);
        
      if (readingError) {
        throw readingError;
      }
      
      // 3. Handle consumables if any
      if (selectedConsumables.length > 0) {
        for (const consumable of selectedConsumables) {
          // Check inventory level in a single query
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('consumables')
            .select('quantity')
            .eq('id', consumable.id)
            .eq('fuel_pump_id', fuelPumpId)
            .single();
            
          if (inventoryError) throw inventoryError;
          
          if (!inventoryData || inventoryData.quantity < consumable.quantity) {
            throw new Error(`Not enough ${consumable.name} in inventory`);
          }
          
          // Create allocation record
          const { error: allocationError } = await supabase
            .from('shift_consumables')
            .insert({
              shift_id: shiftData[0].id,
              consumable_id: consumable.id,
              quantity_allocated: consumable.quantity,
              status: 'allocated'
            });
            
          if (allocationError) throw allocationError;
          
          // Update inventory in a single operation
          const { error: updateError } = await supabase
            .from('consumables')
            .update({ quantity: inventoryData.quantity - consumable.quantity })
            .eq('id', consumable.id)
            .eq('fuel_pump_id', fuelPumpId);
            
          if (updateError) throw updateError;
        }
      }
      
      // Return new shift data for optimistic updates
      return {
        ...shiftData[0],
        staff_name: staffName,
        date: newShift.date || new Date().toISOString().split('T')[0],
        pump_id: newShift.pump_id || '',
        opening_reading: newShift.opening_reading || 0,
        closing_reading: null,
        starting_cash_balance: newShift.starting_cash_balance || 0,
        ending_cash_balance: null,
        card_sales: null,
        upi_sales: null,
        cash_sales: null,
        testing_fuel: null,
        status: 'active',
        fuel_pump_id: fuelPumpId
      } as Shift;
    },
    onSuccess: () => {
      // Invalidate and refetch shifts data
      queryClient.invalidateQueries({ queryKey: ['shifts', fuelPumpId] });
      
      toast({
        title: "Success",
        description: "New shift started successfully"
      });
      
      // Reset form
      setNewShift({
        date: new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        staff_id: '',
        pump_id: '',
        starting_cash_balance: 0,
        opening_reading: 0,
        status: 'active',
        shift_type: 'day'
      });
    },
    onError: (error: Error) => {
      console.error('Error adding shift:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start new shift. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleAddShift = async (selectedConsumables: SelectedConsumable[] = []) => {
    try {
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to manage shifts",
          variant: "destructive"
        });
        return false;
      }
      
      await addShiftMutation.mutateAsync({ newShift, selectedConsumables });
      return true;
    } catch (error) {
      // Error already handled by mutation
      return false;
    }
  };

  // Computed properties
  const activeShifts = shifts.filter(shift => shift.status === 'active');
  const completedShifts = shifts.filter(shift => shift.status === 'completed');
  const isLoading = isLoadingPumpId || isLoadingStaff || isLoadingShifts;

  return {
    shifts,
    staffList,
    isLoading,
    newShift,
    setNewShift,
    fetchShifts,
    handleAddShift,
    activeShifts,
    completedShifts,
    fuelPumpId
  };
}
