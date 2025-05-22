
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SelectedShiftData } from '@/types/shift';
import { useToast } from '@/hooks/use-toast';
import { calculateFuelUsage, getFuelLevels } from '@/utils/fuelCalculations';
import { normalizeFuelType } from '@/utils/fuelCalculations';
import { AllocatedConsumable, ReturnedConsumablesMap } from '@/components/shift/EndShiftConsumables';

export interface FuelReading {
  fuel_type: string;
  opening_reading: number;
  closing_reading: number;
}

interface FormData {
  readings: FuelReading[];
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  indent_sales: number;
  testing_fuel: number;
  testing_fuel_by_type?: Record<string, number>;
  expenses: number;
  cash_remaining: number;
  consumable_expenses: number;
}

interface CashReconciliation {
  expected: number;
  difference: number;
}

export const useEndShiftDialog = (shiftData: SelectedShiftData, onComplete: () => void) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalSales, setTotalSales] = useState(0);
  const [totalLiters, setTotalLiters] = useState(0);
  const [fuelSalesByType, setFuelSalesByType] = useState<Record<string, number>>({});
  const [fuelRates, setFuelRates] = useState<Record<string, number>>({});
  const [allocatedConsumables, setAllocatedConsumables] = useState<AllocatedConsumable[]>([]);
  const [returnedConsumables, setReturnedConsumables] = useState<ReturnedConsumablesMap>({});
  const [consumablesExpense, setConsumablesExpense] = useState(0);
  
  const [cashReconciliation, setCashReconciliation] = useState<CashReconciliation>({
    expected: 0,
    difference: 0
  });
  
  const [formData, setFormData] = useState<FormData>({
    readings: [],
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    indent_sales: 0,
    testing_fuel: 0,
    testing_fuel_by_type: {},
    expenses: 0,
    cash_remaining: 0,
    consumable_expenses: 0
  });
  
  // Load readings data for the shift
  useEffect(() => {
    const loadShiftReadings = async () => {
      try {
        // Reset data
        setFormData({
          readings: [],
          card_sales: 0,
          upi_sales: 0,
          cash_sales: 0,
          indent_sales: 0,
          testing_fuel: 0,
          testing_fuel_by_type: {},
          expenses: 0,
          cash_remaining: 0,
          consumable_expenses: 0
        });
        
        console.log('Loading readings for shift:', shiftData.id);
        
        // Fetch readings for this shift
        const { data: readingsData, error: readingsError } = await supabase
          .from('readings')
          .select('*')
          .eq('shift_id', shiftData.id);
          
        if (readingsError) {
          throw readingsError;
        }
        
        if (!readingsData || readingsData.length === 0) {
          console.log('No readings found for this shift');
          return;
        }
        
        console.log(`Found ${readingsData.length} readings for shift:`, readingsData);
        
        // Transform into fuel readings format
        const transformedReadings = readingsData.map(reading => ({
          fuel_type: reading.fuel_type || 'Unknown',
          opening_reading: reading.opening_reading || 0,
          closing_reading: reading.closing_reading || reading.opening_reading || 0
        }));
        
        // Calculate totals for all readings and fuel usage by type
        const usageByType: Record<string, number> = {};
        let totalLitersDispensed = 0;
        
        transformedReadings.forEach(reading => {
          const fuelType = normalizeFuelType(reading.fuel_type);
          const dispensed = Math.max(0, reading.closing_reading - reading.opening_reading);
          totalLitersDispensed += dispensed;
          
          if (fuelType) {
            // Ensure fuelType is treated as a string when used as an object key
            const fuelTypeStr = String(fuelType);
            if (!usageByType[fuelTypeStr]) {
              usageByType[fuelTypeStr] = 0;
            }
            usageByType[fuelTypeStr] += dispensed;
          }
        });
        
        setFuelSalesByType(usageByType);
        setTotalLiters(totalLitersDispensed);
        
        // Fetch fuel rates
        const fuelPrices = await getFuelLevels();
        const ratesMap: Record<string, number> = {};
        
        Object.entries(fuelPrices).forEach(([type, data]) => {
          ratesMap[type] = data.price || 0;
        });
        
        setFuelRates(ratesMap);
        
        // Initialize testing_fuel_by_type based on available fuel types
        const testingByType: Record<string, number> = {};
        Object.keys(usageByType).forEach(fuelType => {
          // Ensure fuelType is a string (it should be since it's from Object.keys)
          testingByType[String(fuelType)] = 0;
        });
        
        // Fetch existing data for the first reading
        if (readingsData.length > 0) {
          const firstReading = readingsData[0];
          
          // Initialize form with existing data
          setFormData({
            readings: transformedReadings,
            card_sales: firstReading.card_sales || 0,
            upi_sales: firstReading.upi_sales || 0,
            cash_sales: firstReading.cash_sales || 0,
            indent_sales: firstReading.indent_sales || 0,
            testing_fuel: firstReading.testing_fuel || 0,
            testing_fuel_by_type: testingByType,
            expenses: firstReading.expenses || 0,
            cash_remaining: firstReading.cash_remaining || 0,
            consumable_expenses: firstReading.consumable_expenses || 0
          });
          
          // Calculate total sales
          const totalCalculatedSales = 
            (firstReading.card_sales || 0) + 
            (firstReading.upi_sales || 0) + 
            (firstReading.cash_sales || 0) +
            (firstReading.indent_sales || 0);
          
          setTotalSales(totalCalculatedSales);
        }
        
        // Fetch consumables allocated to this shift
        await loadShiftConsumables();
        
        // Fetch indent sales if available
        await fetchIndentSales();
        
      } catch (error) {
        console.error('Error loading shift readings:', error);
        setError('Failed to load shift data. Please try again.');
      }
    };
    
    if (shiftData && shiftData.id) {
      loadShiftReadings();
    }
  }, [shiftData]);
  
  // Fetch indent sales for the shift
  const fetchIndentSales = async () => {
    if (!shiftData || !shiftData.id) return;
    
    try {
      console.log('Fetching indent sales for shift:', shiftData.id);
      
      // Get shift start/end time
      const { data: shiftInfo, error: shiftError } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('id', shiftData.id)
        .single();
        
      if (shiftError || !shiftInfo) {
        console.error('Error fetching shift info for indent calculation:', shiftError);
        return;
      }
      
      const startTime = shiftInfo.start_time;
      const endTime = shiftInfo.end_time || new Date().toISOString();
      
      // Get transactions during shift
      const { data: indentData, error: indentError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('staff_id', shiftData.staff_id)
        .gte('created_at', startTime)
        .lte('created_at', endTime);
        
      if (indentError) {
        console.error('Error fetching indent data:', indentError);
        return;
      }
      
      if (indentData && indentData.length > 0) {
        const totalIndent = indentData.reduce((total, item) => 
          total + (parseFloat(item.amount) || 0), 0);
        
        console.log(`Found ${indentData.length} indent transactions totaling ${totalIndent}`);
        
        setFormData(prev => ({
          ...prev,
          indent_sales: totalIndent
        }));
        
        // Update total sales
        setTotalSales(prev => prev + totalIndent);
      }
    } catch (error) {
      console.error('Error calculating indent sales:', error);
    }
  };
  
  // Load consumables data for the shift
  const loadShiftConsumables = async () => {
    if (!shiftData || !shiftData.id) return;
    
    try {
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
        .eq('shift_id', shiftData.id);
        
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
        const expenses = formattedConsumables.reduce((total, item) => {
          const consumed = item.quantity_allocated - (item.quantity_returned || 0);
          return total + (consumed * (item.price_per_unit || 0));
        }, 0);
        
        setConsumablesExpense(expenses);
        setFormData(prev => ({
          ...prev,
          consumable_expenses: expenses
        }));
      } else {
        console.log('No consumables allocated to this shift');
      }
    } catch (error) {
      console.error('Error loading shift consumables:', error);
    }
  };
  
  // Update returned consumable quantity
  const updateReturnedConsumable = (id: string, quantity: number) => {
    setReturnedConsumables(prev => ({
      ...prev,
      [id]: quantity
    }));
    
    // Recalculate consumable expenses
    const newExpenses = allocatedConsumables.reduce((total, item) => {
      const returnedQty = id === item.id ? quantity : (returnedConsumables[item.id] || 0);
      const consumed = item.quantity_allocated - returnedQty;
      const itemPrice = item.price_per_unit || 0;
      return total + (consumed * itemPrice);
    }, 0);
    
    setConsumablesExpense(newExpenses);
    setFormData(prev => ({
      ...prev,
      consumable_expenses: newExpenses
    }));
  };
  
  // Handle changes to reading fields
  const handleReadingChange = (fuelType: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      readings: prev.readings.map(reading =>
        reading.fuel_type === fuelType
          ? { ...reading, closing_reading: value }
          : reading
      )
    }));
    
    // Recalculate fuel sales by type
    const updatedSalesByType = { ...fuelSalesByType };
    let newTotalLiters = 0;
    
    formData.readings.forEach(reading => {
      const dispensed = reading.fuel_type === fuelType
        ? Math.max(0, value - reading.opening_reading)
        : Math.max(0, reading.closing_reading - reading.opening_reading);
      
      const normalizedType = normalizeFuelType(reading.fuel_type);
      if (normalizedType) {
        // Ensure normalizedType is treated as a string when used as an object key
        const normalizedTypeStr = String(normalizedType);
        updatedSalesByType[normalizedTypeStr] = dispensed;
      }
      newTotalLiters += dispensed;
    });
    
    setFuelSalesByType(updatedSalesByType);
    setTotalLiters(newTotalLiters);
  };
  
  // Handle changes to sales fields
  const handleSalesChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update total sales calculation
    if (['card_sales', 'upi_sales', 'cash_sales', 'indent_sales'].includes(field)) {
      const updatedSales = {
        card_sales: field === 'card_sales' ? value : formData.card_sales,
        upi_sales: field === 'upi_sales' ? value : formData.upi_sales,
        cash_sales: field === 'cash_sales' ? value : formData.cash_sales,
        indent_sales: field === 'indent_sales' ? value : formData.indent_sales
      };
      
      const total = updatedSales.card_sales + updatedSales.upi_sales + 
                    updatedSales.cash_sales + updatedSales.indent_sales;
      
      setTotalSales(total);
    }
  };
  
  // Handle changes to testing fuel by type
  const handleTestingFuelByTypeChange = (fuelType: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      testing_fuel_by_type: {
        ...(prev.testing_fuel_by_type || {}),
        [String(fuelType)]: value
      },
      // Also update the total testing fuel value
      testing_fuel: Object.entries({
        ...(prev.testing_fuel_by_type || {}),
        [String(fuelType)]: value
      }).reduce((sum, [_, val]) => sum + val, 0)
    }));
  };
  
  // Handle changes to other input fields
  const handleInputChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Calculate cash reconciliation
    if (field === 'cash_remaining' || field === 'cash_sales' || field === 'expenses') {
      calculateCashReconciliation(
        field === 'cash_sales' ? value : formData.cash_sales,
        field === 'cash_remaining' ? value : formData.cash_remaining,
        field === 'expenses' ? value : formData.expenses
      );
    }
  };
  
  // Calculate cash reconciliation
  const calculateCashReconciliation = (sales: number, remaining: number, expenses: number) => {
    const expected = sales;
    const difference = remaining - expected + expenses;
    
    setCashReconciliation({
      expected,
      difference
    });
  };
  
  // Submit the form
  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Validate data
      if (formData.readings.some(r => !r.closing_reading || r.closing_reading <= r.opening_reading)) {
        setError('All closing readings must be greater than opening readings');
        return false;
      }
      
      // End the shift
      const now = new Date().toISOString();
      
      // Update the shift record
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          end_time: now,
          status: 'completed',
          cash_remaining: formData.cash_remaining
        })
        .eq('id', shiftData.id);
        
      if (shiftError) {
        throw shiftError;
      }
      
      // Calculate the total testing fuel amount
      let totalTestingFuel = formData.testing_fuel;
      if (formData.testing_fuel_by_type && Object.keys(formData.testing_fuel_by_type).length > 0) {
        totalTestingFuel = Object.values(formData.testing_fuel_by_type).reduce((sum, val) => sum + val, 0);
      }
      
      // Update readings for each fuel type
      for (const reading of formData.readings) {
        // Get the specific testing fuel for this type
        const fuelType = normalizeFuelType(reading.fuel_type);
        
        // Ensure fuelType is treated as a string when used as an object key
        const fuelTypeStr = String(fuelType);
        const testingFuelForType = fuelType && formData.testing_fuel_by_type?.[fuelTypeStr] || 0;
        
        const { error: readingError } = await supabase
          .from('readings')
          .update({
            closing_reading: reading.closing_reading,
            cash_remaining: formData.cash_remaining,
            card_sales: formData.card_sales,
            upi_sales: formData.upi_sales,
            cash_sales: formData.cash_sales,
            indent_sales: formData.indent_sales,
            expenses: formData.expenses,
            consumable_expenses: formData.consumable_expenses,
            // Use specific testing fuel for this fuel type if available
            testing_fuel: testingFuelForType
          })
          .eq('shift_id', shiftData.id)
          .eq('fuel_type', reading.fuel_type);
          
        if (readingError) {
          throw readingError;
        }
      }
      
      // Update consumables
      for (const [id, quantity] of Object.entries(returnedConsumables)) {
        const { error: consumableError } = await supabase
          .from('shift_consumables')
          .update({
            quantity_returned: quantity,
            status: 'returned'
          })
          .eq('id', id);
          
        if (consumableError) {
          console.error('Error updating consumable:', consumableError);
        }
      }
      
      toast({
        title: 'Success',
        description: 'Shift ended successfully!'
      });
      
      // Call the completion callback
      onComplete();
      return true;
    } catch (error) {
      console.error('Error ending shift:', error);
      setError('Failed to end shift. Please try again.');
      
      toast({
        title: 'Error',
        description: 'Failed to end shift. Please try again.',
        variant: 'destructive'
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
    error,
    handleReadingChange,
    handleInputChange,
    handleSalesChange,
    handleTestingFuelByTypeChange,
    updateReturnedConsumable,
    handleSubmit
  };
};

