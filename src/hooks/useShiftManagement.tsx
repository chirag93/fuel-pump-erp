import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Staff, Shift } from '@/types/shift';
import { getFuelPumpId } from '@/integrations/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SelectedConsumable } from '@/components/shift/StartShiftForm';

export const useShiftManagement = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const [completedShifts, setCompletedShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffOnActiveShifts, setStaffOnActiveShifts] = useState<string[]>([]);
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    staff_id: '',
    pump_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    shift_type: 'Day',
    starting_cash_balance: 0
  });
  const { toast } = useToast();
  
  const fetchStaff = useCallback(async (fuelPumpId: string | null) => {
    try {
      setError(null);
      console.log('Fetching staff with fuel_pump_id:', fuelPumpId);
      
      let query = supabase.from('staff').select('*');
      
      if (fuelPumpId) {
        query = query.eq('fuel_pump_id', fuelPumpId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log(`Fetched ${data.length} staff members`);
        setStaffList(data);
      } else {
        console.log('No staff data returned');
        setStaffList([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff data';
      console.error('Error fetching staff:', err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to fetch staff data. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  const fetchShifts = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching shifts...');
      setIsLoading(true);

      const fuelPumpId = await getFuelPumpId();
      console.log('Current fuel pump ID:', fuelPumpId);
      
      // If getFuelPumpId fails, try to fetch all shifts
      let query = supabase
        .from('shifts')
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            staff_numeric_id
          )
        `);
      
      if (fuelPumpId) {
        query = query.eq('fuel_pump_id', fuelPumpId);
      }
      
      const { data: shiftsData, error: shiftsError } = await query;
      
      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        throw shiftsError;
      }
      
      console.log('Shifts data received:', shiftsData);
      
      if (shiftsData && shiftsData.length > 0) {
        console.log(`Fetched ${shiftsData.length} shifts`);
        
        // Fetch all readings for these shifts
        const shiftIds = shiftsData.map(shift => shift.id);
        console.log('Fetching readings for shift IDs:', shiftIds);
        
        const { data: readingsData, error: readingsError } = await supabase
          .from('readings')
          .select('*')
          .in('shift_id', shiftIds);
        
        if (readingsError) {
          console.error('Error fetching readings:', readingsError);
          throw readingsError;
        }
        
        console.log('Readings data received:', readingsData);
        
        // Map the readings to their respective shifts and enhance shift data with readings data
        const shiftsWithReadings = shiftsData.map(shift => {
          const shiftReadings = readingsData?.filter(reading => reading.shift_id === shift.id) || [];
          
          // Calculate sales totals from readings
          let totalCardSales = 0;
          let totalUpiSales = 0;
          let totalCashSales = 0;
          let totalIndentSales = 0;
          let totalTestingFuel = 0;
          let openingReading = 0;
          let closingReading = 0;
          let pumpId = '';
          
          // Get the primary pump ID from readings (first non-empty pump_id)
          const firstReadingWithPumpId = shiftReadings.find(reading => reading.pump_id);
          if (firstReadingWithPumpId) {
            pumpId = firstReadingWithPumpId.pump_id;
          }
          
          // Aggregate sales data across all readings for this shift
          shiftReadings.forEach(reading => {
            totalCardSales += reading.card_sales || 0;
            totalUpiSales += reading.upi_sales || 0;
            totalCashSales += reading.cash_sales || 0;
            totalIndentSales += reading.indent_sales || 0;
            totalTestingFuel += reading.testing_fuel || 0;
            
            // For the first reading, set as opening reading
            if (openingReading === 0 && reading.opening_reading) {
              openingReading = reading.opening_reading;
            }
            
            // Set the maximum closing reading value
            if (reading.closing_reading && reading.closing_reading > closingReading) {
              closingReading = reading.closing_reading;
            }
          });
          
          // Combine shift data with readings data
          return {
            ...shift,
            staff_name: shift.staff?.name || 'Unknown',
            staff_numeric_id: shift.staff?.staff_numeric_id || 'N/A',
            all_readings: shiftReadings,
            pump_id: pumpId || shift.pump_id || 'N/A', // Use reading pump_id if available
            card_sales: totalCardSales > 0 ? totalCardSales : null,
            upi_sales: totalUpiSales > 0 ? totalUpiSales : null,
            cash_sales: totalCashSales > 0 ? totalCashSales : null,
            indent_sales: totalIndentSales > 0 ? totalIndentSales : null,
            testing_fuel: totalTestingFuel > 0 ? totalTestingFuel : null,
            opening_reading: openingReading || null,
            closing_reading: closingReading || null,
            starting_cash_balance: shift.cash_remaining || 0, // Use cash_remaining as starting_cash_balance
            ending_cash_balance: null // Will be populated from the first reading if available
          };
        });
        
        console.log('Processed shifts with readings:', shiftsWithReadings);
        
        // Split into active and completed shifts
        const active = shiftsWithReadings.filter(shift => shift.status === 'active');
        const completed = shiftsWithReadings.filter(shift => shift.status === 'completed');
        
        console.log('Active shifts:', active.length);
        console.log('Completed shifts:', completed.length);
        
        setActiveShifts(active);
        setCompletedShifts(completed);
        
        // Create a list of staff IDs who are on active shifts
        const staffOnShifts = active.map(shift => shift.staff_id);
        setStaffOnActiveShifts(staffOnShifts);
        
        // Wait for staff data to be fetched
        await fetchStaff(fuelPumpId);
      } else {
        console.log('No shifts data found');
        setActiveShifts([]);
        setCompletedShifts([]);
        setStaffOnActiveShifts([]);
        await fetchStaff(fuelPumpId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shifts';
      console.error('Error in fetchShifts:', err);
      setError(errorMessage);
      toast({
        title: "Error loading shifts",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchStaff, toast]);
  
  useEffect(() => {
    fetchShifts();
    
    // Clean up function
    return () => {
      setStaffList([]);
      setActiveShifts([]);
      setCompletedShifts([]);
    };
  }, [fetchShifts]);
  
  const handleAddShift = async (selectedConsumables?: SelectedConsumable[], nozzleReadings?: any[]) => {
    try {
      setError(null);
      console.log('Starting new shift...');
      setIsLoading(true);
      
      if (!newShift.staff_id || !newShift.pump_id) {
        const errorMsg = 'Staff and pump selection are required.';
        setError(errorMsg);
        toast({
          title: "Missing Information",
          description: errorMsg,
          variant: "destructive"
        });
        return false;
      }

      // Get the fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      if (!fuelPumpId) {
        console.warn('Could not determine fuel pump ID. Attempting to continue without it.');
      }
      
      // Insert the shift record
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          staff_id: newShift.staff_id,
          start_time: new Date().toISOString(),
          status: 'active',
          shift_type: newShift.shift_type || 'Day',
          fuel_pump_id: fuelPumpId
        })
        .select();
      
      if (shiftError) {
        console.error('Error creating shift:', shiftError);
        throw shiftError;
      }
      
      if (!shiftData || shiftData.length === 0) {
        throw new Error('Failed to create shift record');
      }
      
      const shiftId = shiftData[0].id;
      console.log('Created new shift with ID:', shiftId);
      
      // Insert reading records if nozzle readings are provided
      if (nozzleReadings && nozzleReadings.length > 0) {
        console.log('Inserting nozzle readings:', nozzleReadings);
        
        // Create reading records for each nozzle
        const readingPromises = nozzleReadings.map(async (reading) => {
          return supabase
            .from('readings')
            .insert({
              shift_id: shiftId,
              staff_id: newShift.staff_id,
              pump_id: newShift.pump_id,
              opening_reading: reading.opening_reading,
              date: newShift.date,
              fuel_type: reading.fuel_type,
              cash_given: newShift.starting_cash_balance || 0,
              fuel_pump_id: fuelPumpId
            });
        });
        
        const readingResults = await Promise.all(readingPromises);
        
        // Check for errors
        const readingErrors = readingResults.filter(result => result.error);
        if (readingErrors.length > 0) {
          console.error('Errors inserting readings:', readingErrors);
          toast({
            title: "Warning",
            description: "Shift created but there were issues with some readings",
            variant: "destructive"
          });
        }
      }
      
      // Insert consumables if selected
      if (selectedConsumables && selectedConsumables.length > 0) {
        console.log('Inserting consumables:', selectedConsumables);
        
        const consumablePromises = selectedConsumables.map(async (item) => {
          return supabase
            .from('shift_consumables')
            .insert({
              shift_id: shiftId,
              consumable_id: item.id,
              quantity_allocated: item.quantity,
              status: 'allocated'
            });
        });
        
        const consumableResults = await Promise.all(consumablePromises);
        
        // Check for errors
        const consumableErrors = consumableResults.filter(result => result.error);
        if (consumableErrors.length > 0) {
          console.error('Errors allocating consumables:', consumableErrors);
          toast({
            title: "Warning",
            description: "Shift created but there were issues allocating some consumables",
            variant: "destructive"
          });
        }
      }
      
      // Clear the form data
      setNewShift({
        staff_id: '',
        pump_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        shift_type: 'Day',
        starting_cash_balance: 0
      });
      
      // Refresh the shifts data
      await fetchShifts();
      
      toast({
        title: "Success",
        description: "New shift started successfully",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start shift';
      console.error('Error adding shift:', err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    staffList,
    activeShifts,
    completedShifts,
    isLoading,
    error,
    newShift,
    setNewShift,
    handleAddShift,
    fetchShifts,
    staffOnActiveShifts
  };
};
