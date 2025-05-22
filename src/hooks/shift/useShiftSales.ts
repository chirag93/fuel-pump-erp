
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShiftSalesData } from '@/types/shift-hooks';

export function useShiftSales(shiftId: string, staffId: string) {
  const [salesData, setSalesData] = useState<ShiftSalesData>({
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    indent_sales: 0,
    testing_fuel: 0,
    testing_fuel_by_type: {}
  });
  const [totalSales, setTotalSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial sales data and indent sales
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!shiftId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch existing sales data from readings
        const { data: readingsData, error: readingsError } = await supabase
          .from('readings')
          .select('*')
          .eq('shift_id', shiftId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (readingsError) throw readingsError;
        
        if (readingsData && readingsData.length > 0) {
          const reading = readingsData[0];
          
          // Create testing fuel by type object with proper string keys
          const testingFuelByType: Record<string, number> = {};
          if (reading.fuel_type) {
            // IMPORTANT: Always ensure fuel type is a string when used as an object key
            testingFuelByType[String(reading.fuel_type)] = reading.testing_fuel || 0;
          }
          
          setSalesData({
            card_sales: reading.card_sales || 0,
            upi_sales: reading.upi_sales || 0,
            cash_sales: reading.cash_sales || 0,
            indent_sales: reading.indent_sales || 0,
            testing_fuel: reading.testing_fuel || 0,
            testing_fuel_by_type: testingFuelByType
          });
        }
        
        // If staffId is provided, fetch indent transactions
        if (staffId) {
          await fetchIndentSales(staffId);
        }
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Failed to load sales data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSalesData();
  }, [shiftId, staffId]);

  // Calculate total sales whenever sales data changes
  useEffect(() => {
    const total = 
      salesData.card_sales + 
      salesData.upi_sales + 
      salesData.cash_sales + 
      salesData.indent_sales;
      
    setTotalSales(total);
  }, [salesData]);

  // Fetch indent sales for staff during this shift
  const fetchIndentSales = async (staffId: string) => {
    if (!shiftId) return;
    
    try {
      // Get shift start/end time
      const { data: shiftInfo, error: shiftError } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('id', shiftId)
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
        .eq('staff_id', staffId)
        .gte('created_at', startTime)
        .lte('created_at', endTime);
        
      if (indentError) {
        console.error('Error fetching indent data:', indentError);
        return;
      }
      
      if (indentData && indentData.length > 0) {
        // Fix: Explicitly convert amount to string before parsing
        const totalIndent = indentData.reduce((total, item) => 
          total + (parseFloat(String(item.amount)) || 0), 0);
        
        console.log(`Found ${indentData.length} indent transactions totaling ${totalIndent}`);
        
        setSalesData(prev => ({
          ...prev,
          indent_sales: totalIndent
        }));
      }
    } catch (error) {
      console.error('Error calculating indent sales:', error);
    }
  };

  // Handle sales field changes
  const handleSalesChange = (field: keyof ShiftSalesData, value: number) => {
    setSalesData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle testing fuel by type changes
  const handleTestingFuelByTypeChange = (fuelType: string | number, value: number) => {
    // Ensure fuelType is always a string
    const fuelTypeStr = String(fuelType);
    
    // Create a new copy of the testing fuel by type object with the updated value
    const updatedTestingByType = {
      ...(salesData.testing_fuel_by_type || {}),
      [fuelTypeStr]: value
    };
    
    // Calculate total testing fuel
    const totalTestingFuel = Object.values(updatedTestingByType).reduce((sum, val) => sum + val, 0);
    
    // Update the sales data state
    setSalesData(prev => ({
      ...prev,
      testing_fuel_by_type: updatedTestingByType,
      testing_fuel: totalTestingFuel
    }));
  };

  return {
    salesData,
    totalSales,
    isLoading,
    error,
    handleSalesChange,
    handleTestingFuelByTypeChange
  };
}
