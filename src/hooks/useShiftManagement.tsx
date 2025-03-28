
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Shift, Staff } from '@/types/shift';
import { SelectedConsumable } from '@/components/shift/StartShiftForm';
import { getFuelPumpId } from '@/integrations/utils';

export function useShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
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

  useEffect(() => {
    const initFuelPumpId = async () => {
      const id = await getFuelPumpId();
      setFuelPumpId(id);
      if (id) {
        fetchStaffList(id);
      } else {
        console.log('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to manage shifts",
          variant: "destructive"
        });
      }
    };
    
    initFuelPumpId();
  }, []);

  const fetchStaffList = async (pumpId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, staff_numeric_id, role')
        .eq('fuel_pump_id', pumpId);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setStaffList(data);
      }
      
      // After fetching staff, fetch shifts
      fetchShifts(pumpId);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error loading staff data",
        description: "Failed to load staff data from the database.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  const fetchShifts = async (pumpId: string = fuelPumpId || '') => {
    setIsLoading(true);
    
    if (!pumpId) {
      console.warn('No fuel pump ID available, cannot fetch shifts');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view shifts",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          id,
          staff_id,
          shift_type,
          start_time,
          end_time,
          status,
          created_at
        `)
        .eq('fuel_pump_id', pumpId);
        
      if (shiftsError) {
        throw shiftsError;
      }
      
      if (!shiftsData) {
        setShifts([]);
        setIsLoading(false);
        return;
      }
      
      const shiftsWithStaffNames = await Promise.all(
        shiftsData.map(async (shift) => {
          const { data: staffData } = await supabase
            .from('staff')
            .select('name, staff_numeric_id')
            .eq('id', shift.staff_id)
            .eq('fuel_pump_id', pumpId)
            .single();
            
          const { data: readingsData } = await supabase
            .from('readings')
            .select('*')
            .eq('shift_id', shift.id)
            .eq('fuel_pump_id', pumpId)
            .single();
            
          return {
            ...shift,
            staff_name: staffData?.name || 'Unknown Staff',
            staff_numeric_id: staffData?.staff_numeric_id || null,
            date: readingsData?.date || new Date().toISOString().split('T')[0],
            pump_id: readingsData?.pump_id || 'Unknown',
            opening_reading: readingsData?.opening_reading || 0,
            closing_reading: readingsData?.closing_reading || null,
            starting_cash_balance: readingsData?.cash_given || 0,
            ending_cash_balance: readingsData?.cash_remaining || null,
            card_sales: readingsData?.card_sales || null,
            upi_sales: readingsData?.upi_sales || null,
            cash_sales: readingsData?.cash_sales || null,
            testing_fuel: readingsData?.testing_fuel || null,
            fuel_pump_id: pumpId
          } as Shift;
        })
      );
      
      setShifts(shiftsWithStaffNames);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast({
        title: "Error loading shifts",
        description: "Failed to load shift data from the database.",
        variant: "destructive"
      });
      
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      if (!newShift.staff_id || !newShift.pump_id || !newShift.opening_reading) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return false;
      }
      
      const staffName = staffList.find(s => s.id === newShift.staff_id)?.name || 'Unknown Staff';
      
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
      
      // Handle consumables allocation if any are selected
      if (selectedConsumables && selectedConsumables.length > 0) {
        for (const consumable of selectedConsumables) {
          // Check current inventory level
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
          
          // Update inventory
          const { error: updateError } = await supabase
            .from('consumables')
            .update({ quantity: inventoryData.quantity - consumable.quantity })
            .eq('id', consumable.id)
            .eq('fuel_pump_id', fuelPumpId);
            
          if (updateError) throw updateError;
        }
      }
      
      const newShiftWithName: Shift = {
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
      };
      
      setShifts([...shifts, newShiftWithName]);
      toast({
        title: "Success",
        description: "New shift started successfully"
      });
      
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
      
      return true;
    } catch (error) {
      console.error('Error adding shift:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start new shift. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const activeShifts = shifts.filter(shift => shift.status === 'active');
  const completedShifts = shifts.filter(shift => shift.status === 'completed');

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
