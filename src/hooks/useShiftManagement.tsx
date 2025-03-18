
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Shift, Staff } from '@/types/shift';

export function useShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setStaffList(data);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error loading staff data",
          description: "Failed to load staff data from the database.",
          variant: "destructive"
        });
      }
    };
    
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchShifts();
  }, []);
  
  const fetchShifts = async () => {
    setIsLoading(true);
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
        `);
        
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
            .select('name')
            .eq('id', shift.staff_id)
            .single();
            
          const { data: readingsData } = await supabase
            .from('readings')
            .select('*')
            .eq('shift_id', shift.id)
            .single();
            
          return {
            ...shift,
            staff_name: staffData?.name || 'Unknown Staff',
            date: readingsData?.date || new Date().toISOString().split('T')[0],
            pump_id: readingsData?.pump_id || 'Unknown',
            opening_reading: readingsData?.opening_reading || 0,
            closing_reading: readingsData?.closing_reading || null,
            starting_cash_balance: readingsData?.cash_given || 0,
            ending_cash_balance: readingsData?.cash_remaining || null,
            card_sales: readingsData?.card_sales || null,
            upi_sales: readingsData?.upi_sales || null,
            cash_sales: readingsData?.cash_sales || null,
            testing_fuel: readingsData?.testing_fuel || null
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

  const handleAddShift = async () => {
    try {
      if (!newShift.staff_id || !newShift.pump_id || !newShift.opening_reading) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const staffName = staffList.find(s => s.id === newShift.staff_id)?.name || 'Unknown Staff';
      
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .insert([{
          staff_id: newShift.staff_id,
          shift_type: newShift.shift_type || 'day',
          start_time: new Date().toISOString(),
          status: 'active'
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
          cash_given: newShift.starting_cash_balance || 0
        }]);
        
      if (readingError) {
        throw readingError;
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
        status: 'active'
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
    completedShifts
  };
}
