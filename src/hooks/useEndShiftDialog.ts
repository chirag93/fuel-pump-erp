
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { SelectedShiftData, ShiftReading } from '@/types/shift';
import { FuelReading } from '@/components/shift/EndShiftReadings';
import { SelectedConsumable } from '@/components/shift/ConsumableSelection';
import { SalesFormData } from '@/components/shift/EndShiftSales';

// Define a specific interface for the form data to avoid deep instantiation
export interface EndShiftFormData {
  readings: FuelReading[];
  cash_remaining: number;
  expenses: number;
  consumable_expenses: number;
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  indent_sales: number; // Added indent sales field
  testing_fuel: number;
}

export function useEndShiftDialog(shiftData: SelectedShiftData, onShiftEnded: () => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<EndShiftFormData>({
    readings: [],
    cash_remaining: 0,
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    indent_sales: 0, // Initialize indent sales
    testing_fuel: 0,
    expenses: 0,
    consumable_expenses: 0
  });

  // Consumables state
  const [allocatedConsumables, setAllocatedConsumables] = useState<SelectedConsumable[]>([]);
  const [returnedConsumables, setReturnedConsumables] = useState<SelectedConsumable[]>([]);
  const [consumablesExpense, setConsumablesExpense] = useState<number>(0);

  // Derived calculations
  const totalSales = formData.card_sales + formData.upi_sales + formData.cash_sales + formData.indent_sales; // Include indent sales in total
  const totalLiters = formData.readings.reduce((sum, reading) => {
    return sum + Math.max(0, reading.closing_reading - reading.opening_reading);
  }, 0);
  
  // Fuel-type specific sales calculations
  const [fuelSalesByType, setFuelSalesByType] = useState<Record<string, number>>({});
  const [fuelRates, setFuelRates] = useState<Record<string, number>>({});
  
  // Cash reconciliation
  const [cashReconciliation, setCashReconciliation] = useState({
    expected: 0,
    difference: 0
  });

  useEffect(() => {
    if (shiftData) {
      console.log("Shift data loaded:", shiftData.id);
      fetchShiftReadings();
      fetchShiftConsumables();
      fetchStaffIndentSales(); // Fetch indent sales for the staff
    }
  }, [shiftData]);

  // Fetch staff indent sales during the shift
  const fetchStaffIndentSales = async () => {
    try {
      console.log("Fetching indent sales for staff:", shiftData.staff_id);
      
      // Get the shift start time to find indents during this shift
      const { data: shiftDetails, error: shiftError } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('id', shiftData.id)
        .single();
      
      if (shiftError) throw shiftError;
      
      if (!shiftDetails?.start_time) {
        console.log("No start time available for shift");
        return;
      }
      
      // Use end_time if available, otherwise use current time
      const endTime = shiftDetails.end_time || new Date().toISOString();
      
      // Query transactions made by this staff during the shift
      const { data: indentData, error: indentError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('staff_id', shiftData.staff_id)
        .gte('created_at', shiftDetails.start_time)
        .lte('created_at', endTime);
      
      if (indentError) throw indentError;
      
      if (indentData && indentData.length > 0) {
        // Sum up all the indent amounts
        const totalIndentSales = indentData.reduce((sum, transaction) => {
          return sum + (parseFloat(transaction.amount.toString()) || 0);
        }, 0);
        
        console.log(`Found ${indentData.length} indent transactions totaling ₹${totalIndentSales}`);
        
        // Update form data with the indent sales amount
        setFormData(prev => ({
          ...prev,
          indent_sales: totalIndentSales
        }));
      } else {
        console.log("No indent transactions found for this staff during the shift");
      }
    } catch (error) {
      console.error('Error fetching staff indent sales:', error);
    }
  };

  // Fetch fuel rates from database
  useEffect(() => {
    if (shiftData) {
      const fetchFuelRates = async () => {
        try {
          const { data, error } = await supabase
            .from('fuel_settings')
            .select('fuel_type, current_price');
            
          if (error) throw error;
          
          if (data) {
            const rates: Record<string, number> = {};
            data.forEach(item => {
              rates[item.fuel_type] = item.current_price;
            });
            setFuelRates(rates);
          }
        } catch (error) {
          console.error('Error fetching fuel rates:', error);
        }
      };
      
      fetchFuelRates();
    }
  }, [shiftData]);
  
  useEffect(() => {
    // Calculate sales by fuel type
    const salesByType: Record<string, number> = {};
    
    formData.readings.forEach(reading => {
      const liters = Math.max(0, reading.closing_reading - reading.opening_reading);
      // Fetch or estimate price per liter
      // For simplicity, we're estimating based on total sales proportional to liters
      if (totalLiters > 0 && liters > 0) {
        salesByType[reading.fuel_type] = (salesByType[reading.fuel_type] || 0) + liters;
      }
    });
    
    setFuelSalesByType(salesByType);
  }, [formData.readings, totalSales, totalLiters]);

  useEffect(() => {
    // Calculate cash reconciliation when relevant values change
    const expectedCash = formData.cash_sales;
    const actualCash = formData.cash_remaining;
    const expenses = formData.expenses || 0;
    const difference = actualCash - expectedCash + expenses;
    
    setCashReconciliation({
      expected: expectedCash,
      difference: difference
    });
  }, [formData.cash_sales, formData.cash_remaining, formData.expenses]);

  const fetchShiftReadings = async () => {
    try {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('shift_id', shiftData.id);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Safely map the data to our FuelReading[] type
        const fuelReadings: FuelReading[] = data.map((reading: any) => ({
          fuel_type: reading.fuel_type || 'Unknown',
          opening_reading: reading.opening_reading || 0,
          closing_reading: reading.closing_reading || reading.opening_reading
        }));
        
        // Update state with the explicitly typed readings
        setFormData(prev => ({
          ...prev,
          readings: fuelReadings
        }));
      } else {
        // Handle case when no readings are found - create a default one
        console.warn('No readings found for shift:', shiftData.id);
        
        // Create a default reading if no readings are found
        const defaultReading: FuelReading = {
          fuel_type: 'Diesel', // Default fuel type
          opening_reading: shiftData.opening_reading || 0,
          closing_reading: shiftData.opening_reading || 0
        };
        
        setFormData(prev => ({
          ...prev,
          readings: [defaultReading]
        }));
        
        toast({
          title: "Warning",
          description: "No meter readings found for this shift. Using opening readings as default.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching shift readings:', error);
      toast({
        title: "Error",
        description: "Failed to load shift readings",
        variant: "destructive"
      });
    }
  };

  // Fetch consumables allocated to this shift
  const fetchShiftConsumables = async () => {
    try {
      console.log("Fetching consumables for shift:", shiftData.id);
      
      // Get consumables allocated to this shift
      const { data: allocations, error: allocationsError } = await supabase
        .from('shift_consumables')
        .select(`
          id,
          quantity_allocated,
          quantity_returned,
          consumable_id,
          consumables:consumable_id (
            id,
            name,
            unit,
            price_per_unit
          )
        `)
        .eq('shift_id', shiftData.id);
        
      if (allocationsError) {
        console.error('Error fetching shift consumables:', allocationsError);
        throw allocationsError;
      }
      
      console.log("Allocated consumables data:", allocations);
      
      if (allocations && allocations.length > 0) {
        const allocated: SelectedConsumable[] = allocations.map((item: any) => ({
          id: item.consumable_id,
          name: item.consumables?.name || 'Unknown',
          unit: item.consumables?.unit || 'Units',
          price_per_unit: item.consumables?.price_per_unit || 0,
          quantity: item.quantity_allocated || 0,
          available: item.quantity_allocated || 0
        }));
        
        // Initialize returned consumables with the same items but use returned quantity if available
        const returned: SelectedConsumable[] = allocations.map((item: any) => ({
          id: item.consumable_id,
          name: item.consumables?.name || 'Unknown',
          unit: item.consumables?.unit || 'Units',
          price_per_unit: item.consumables?.price_per_unit || 0,
          quantity: item.quantity_returned || 0,
          available: item.quantity_allocated || 0
        }));
        
        setAllocatedConsumables(allocated);
        setReturnedConsumables(returned);
        
        // Calculate initial consumable expenses
        calculateConsumableExpenses(allocated, returned);
      } else {
        console.log("No consumables found for this shift");
        setAllocatedConsumables([]);
        setReturnedConsumables([]);
        setConsumablesExpense(0);
      }
    } catch (error) {
      console.error('Error fetching shift consumables:', error);
      toast({
        title: "Error",
        description: "Failed to load consumables data",
        variant: "destructive"
      });
    }
  };

  // Calculate consumable expenses based on allocated and returned quantities
  const calculateConsumableExpenses = (allocated: SelectedConsumable[], returned: SelectedConsumable[]) => {
    let totalExpense = 0;
    
    allocated.forEach(item => {
      const returnedItem = returned.find(r => r.id === item.id);
      const soldQuantity = item.quantity - (returnedItem?.quantity || 0);
      totalExpense += soldQuantity * item.price_per_unit;
    });
    
    console.log("Calculated consumables expense:", totalExpense);
    setConsumablesExpense(totalExpense);
    setFormData(prev => ({
      ...prev,
      consumable_expenses: totalExpense
    }));
  };

  // Update returned consumable quantity
  const updateReturnedConsumable = (id: string, quantity: number) => {
    console.log(`Updating returned consumable ${id} to quantity ${quantity}`);
    const updatedReturned = returnedConsumables.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    
    setReturnedConsumables(updatedReturned);
    calculateConsumableExpenses(allocatedConsumables, updatedReturned);
  };

  // Handler for reading changes
  const handleReadingChange = (fuelType: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      readings: prev.readings.map(reading => 
        reading.fuel_type === fuelType 
          ? { ...reading, closing_reading: value } 
          : reading
      )
    }));
  };

  // Handler for sales and other numeric inputs
  const handleInputChange = (field: keyof Omit<EndShiftFormData, 'readings'>, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for sales form data changes
  const handleSalesChange = (field: keyof SalesFormData, value: number) => {
    handleInputChange(field, value);
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      
      // Validate closing readings are greater than opening
      const hasInvalidReading = formData.readings.some(
        reading => reading.closing_reading < reading.opening_reading
      );
      
      if (hasInvalidReading) {
        toast({
          title: "Invalid readings",
          description: "Closing readings cannot be less than opening readings",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // 1. Update shift status
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          cash_remaining: formData.cash_remaining
        })
        .eq('id', shiftData.id);
        
      if (shiftError) throw shiftError;
      
      // 2. Update readings for each fuel type
      for (const reading of formData.readings) {
        // Check if reading exists for this fuel type
        const { data: existingReadings, error: checkError } = await supabase
          .from('readings')
          .select('id')
          .eq('shift_id', shiftData.id)
          .eq('fuel_type', reading.fuel_type);
          
        if (checkError) throw checkError;
        
        if (existingReadings && existingReadings.length > 0) {
          // Update existing reading with all sales data including indent_sales
          const { error: readingError } = await supabase
            .from('readings')
            .update({
              closing_reading: reading.closing_reading,
              cash_remaining: formData.cash_remaining,
              card_sales: formData.card_sales,
              upi_sales: formData.upi_sales,
              cash_sales: formData.cash_sales,
              indent_sales: formData.indent_sales,
              testing_fuel: formData.testing_fuel,
              expenses: formData.expenses,
              consumable_expenses: formData.consumable_expenses
            })
            .eq('shift_id', shiftData.id)
            .eq('fuel_type', reading.fuel_type);
            
          if (readingError) throw readingError;
        } else {
          // Create new reading if it doesn't exist - include indent_sales
          const { error: createError } = await supabase
            .from('readings')
            .insert({
              shift_id: shiftData.id,
              staff_id: shiftData.staff_id,
              pump_id: shiftData.pump_id || 'Unknown',
              date: new Date().toISOString().split('T')[0],
              fuel_type: reading.fuel_type,
              opening_reading: reading.opening_reading,
              closing_reading: reading.closing_reading,
              cash_remaining: formData.cash_remaining,
              card_sales: formData.card_sales,
              upi_sales: formData.upi_sales,
              cash_sales: formData.cash_sales,
              indent_sales: formData.indent_sales,
              testing_fuel: formData.testing_fuel,
              expenses: formData.expenses,
              consumable_expenses: formData.consumable_expenses
            });
            
          if (createError) throw createError;
        }
      }
      
      // 3. Update returned consumables if any were allocated
      if (allocatedConsumables.length > 0) {
        for (const item of returnedConsumables) {
          const allocated = allocatedConsumables.find(a => a.id === item.id);
          if (allocated) {
            // Update the shift_consumables record with returned quantity
            const { error: updateError } = await supabase
              .from('shift_consumables')
              .update({
                quantity_returned: item.quantity,
                status: 'returned'
              })
              .eq('shift_id', shiftData.id)
              .eq('consumable_id', item.id);
              
            if (updateError) throw updateError;
          }
        }
      }
      
      toast({
        title: "Success",
        description: "Shift ended successfully"
      });
      
      onShiftEnded();
      return true;
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error",
        description: "Failed to end shift. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    formData,
    isProcessing,
    totalSales,
    totalLiters,
    fuelSalesByType,
    fuelRates,
    cashReconciliation,
    allocatedConsumables,
    returnedConsumables,
    consumablesExpense,
    handleReadingChange,
    handleInputChange,
    handleSalesChange,
    updateReturnedConsumable,
    handleSubmit
  };
}
