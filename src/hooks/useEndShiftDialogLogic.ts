import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Type definitions for form data
export interface ShiftFormData {
  closing_reading: number;
  cash_remaining: number;
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  indent_sales: number;
  expenses: number;
}

// Type definitions for reading data
export interface ReadingData {
  id?: string;
  shift_id?: string;
  staff_id?: string;
  pump_id?: string;
  opening_reading?: number;
  closing_reading?: number | null;
  cash_given?: number;
  cash_remaining?: number | null;
  card_sales?: number | null;
  upi_sales?: number | null;
  cash_sales?: number | null;
  testing_fuel?: number | null;
  expenses?: number | null;
  date?: string;
  created_at?: string;
  indent_sales?: number | null;
  fuel_type?: string;
  consumable_expenses?: number;
  fuel_pump_id?: string;
}

// Type for cash reconciliation
export interface CashReconciliation {
  expected: number;
  difference: number;
}

// Type for new shift data
export interface NewShiftData {
  staff_id: string;
  pump_id: string;
  opening_reading: number;
  cash_given: number;
  date: string;
}

// Type for staff list
export interface StaffMember {
  id: string;
  name: string;
}

export function useEndShiftDialogLogic(
  shiftId: string,
  staffId: string,
  pumpId: string,
  openingReading: number,
  onComplete: () => void
) {
  // State variables
  const [mode, setMode] = useState<'end-only' | 'end-and-start'>('end-only');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  const [isEditingCompletedShift, setIsEditingCompletedShift] = useState(false);
  const [indentSales, setIndentSales] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading shift data...');
  const maxRetries = 5;
  
  // Default form data state
  const [formData, setFormData] = useState<ShiftFormData>({
    closing_reading: 0,
    cash_remaining: 0,
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    indent_sales: 0,
    expenses: 0
  });
  
  const [totalSales, setTotalSales] = useState(0);
  const [cashReconciliation, setCashReconciliation] = useState<CashReconciliation>({
    expected: 0,
    difference: 0
  });
  
  const [newShiftData, setNewShiftData] = useState<NewShiftData>({
    staff_id: '',
    pump_id: pumpId,
    opening_reading: 0,
    cash_given: 0,
    date: new Date().toISOString().split('T')[0]
  });
  
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  
  // Reset everything when shift ID changes
  useEffect(() => {
    if (shiftId) {
      setRetryCount(0);
      setIsDataLoaded(false);
      setError(null);
      setLoadingMessage('Loading shift data...');
      
      console.log('Initializing with shift ID:', shiftId);
      
      // Reset form data to prevent stale data
      setFormData({
        closing_reading: 0,
        cash_remaining: 0,
        card_sales: 0,
        upi_sales: 0,
        cash_sales: 0,
        indent_sales: 0,
        expenses: 0
      });
    }
  }, [shiftId]);

  // Reset form on dialog open
  useEffect(() => {
    if (!isEditingCompletedShift) {
      setFormData({
        closing_reading: 0,
        cash_remaining: 0,
        card_sales: 0,
        upi_sales: 0,
        cash_sales: 0,
        indent_sales: 0,
        expenses: 0
      });
      
      setNewShiftData({
        staff_id: '',
        pump_id: pumpId,
        opening_reading: 0,
        cash_given: 0,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Fetch indent sales for staff
      if (staffId) {
        fetchStaffIndentSales(staffId);
      }
    }
    
    setError(null);
  }, [isEditingCompletedShift, pumpId, staffId, shiftId]);

  // Fetch indent sales for the staff during this shift
  const fetchStaffIndentSales = useCallback(async (staffId: string) => {
    if (!staffId || !shiftId) {
      console.log("Missing staffId or shiftId for indent sales fetch");
      return;
    }
    
    try {
      setLoadingMessage('Checking indent sales...');
      console.log("Fetching indent sales for staff:", staffId);
      
      // Get the shift start time to find indents during this shift
      const { data: shiftDetail, error: shiftError } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('id', shiftId)
        .maybeSingle();
      
      if (shiftError) {
        console.error("Error fetching shift details for indent sales:", shiftError);
        return;
      }
      
      if (!shiftDetail?.start_time) {
        console.log("No start time available for shift");
        return;
      }
      
      // Use end_time if available, otherwise use current time
      const endTime = shiftDetail.end_time || new Date().toISOString();
      
      // Query transactions made by this staff during the shift
      const { data: indentData, error: indentError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('staff_id', staffId)
        .gte('created_at', shiftDetail.start_time)
        .lte('created_at', endTime);
      
      if (indentError) {
        console.error("Error fetching indent transactions:", indentError);
        return;
      }
      
      if (indentData && indentData.length > 0) {
        // Sum up all the indent amounts
        const totalIndentSales = indentData.reduce((sum, transaction) => {
          return sum + (parseFloat(transaction.amount.toString()) || 0);
        }, 0);
        
        console.log(`Found ${indentData.length} indent transactions totaling ₹${totalIndentSales}`);
        
        // Update form data with the indent sales amount
        setIndentSales(totalIndentSales);
        setFormData(prev => ({
          ...prev,
          indent_sales: totalIndentSales
        }));
      } else {
        console.log("No indent transactions found for this staff during the shift");
        setIndentSales(0);
      }
    } catch (error) {
      console.error('Error fetching staff indent sales:', error);
    }
  }, [shiftId]);

  // Check if we're editing a completed shift with improved error handling
  const checkShiftStatus = useCallback(async () => {
    if (!shiftId) {
      console.log("No shift ID provided, skipping shift status check");
      return;
    }
    
    try {
      console.log("Checking shift status for ID:", shiftId);
      setLoading(true);
      setLoadingMessage('Checking shift status...');
      
      // Use maybeSingle instead of single for better error handling
      const { data, error } = await supabase
        .from('shifts')
        .select('status, end_time')
        .eq('id', shiftId)
        .maybeSingle();
      
      if (error) {
        console.error('Supabase error checking shift status:', error);
        throw error;
      }
      
      console.log("Shift status data:", data);
      
      if (!data) {
        console.warn(`No shift found with ID ${shiftId}`);
        throw new Error(`No shift found with ID ${shiftId}`);
      }
      
      // If shift has end_time and status is completed, we're editing a completed shift
      if (data.end_time && data.status === 'completed') {
        console.log("Editing a completed shift");
        setIsEditingCompletedShift(true);
        
        // Load the existing data for this completed shift
        await loadCompletedShiftData(shiftId);
      } else {
        console.log("Not editing a completed shift");
        setIsEditingCompletedShift(false);
        // Reset to end-only mode for active shifts by default
        setMode('end-only');
      }
      
      setIsDataLoaded(true);
    } catch (err) {
      console.error('Error checking shift status:', err);
      setError("Failed to check shift status. Please try again.");
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  // Load data for completed shift with better error handling
  const loadCompletedShiftData = useCallback(async (shiftId: string) => {
    if (!shiftId) {
      console.error("Cannot load completed shift data: Missing shift ID");
      return Promise.reject(new Error("Missing shift ID"));
    }
    
    try {
      console.log("Loading completed shift data for ID:", shiftId);
      setLoadingMessage('Loading shift readings...');
      
      // Get existing readings, using .select() instead of .maybeSingle() to handle multiple readings
      const { data: readingsData, error: readingError } = await supabase
        .from('readings')
        .select('*')
        .eq('shift_id', shiftId);
        
      if (readingError) {
        console.error('Supabase error fetching reading data:', readingError);
        throw readingError;
      }
      
      if (readingsData && readingsData.length > 0) {
        console.log(`Found ${readingsData.length} reading records for this shift:`, readingsData);
        
        // Take the most recent reading or the one with the most complete data
        // We'll select the reading with the highest closing_reading value if available
        const sortedReadings = readingsData.sort((a, b) => {
          // Sort by closing_reading (highest first)
          const closingA = a.closing_reading || 0;
          const closingB = b.closing_reading || 0;
          
          if (closingB !== closingA) {
            return closingB - closingA;
          }
          
          // If closing readings are the same, sort by created_at (newest first)
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        
        // Use the first (likely most relevant) reading after sorting
        const readingData = sortedReadings[0];
        console.log("Using reading data:", readingData);
        
        // Handle the case where the expenses field might not exist in older records
        const expensesValue = readingData.expenses !== undefined ? readingData.expenses : 0;
        
        // Handle the case where indent_sales might not exist in older records
        const indentSalesValue = readingData.indent_sales !== undefined ? readingData.indent_sales : 0;
        
        // Make sure we have valid numbers for all fields
        const formValues = {
          closing_reading: readingData.closing_reading || 0,
          cash_remaining: readingData.cash_remaining || 0,
          card_sales: readingData.card_sales || 0,
          upi_sales: readingData.upi_sales || 0,
          cash_sales: readingData.cash_sales || 0,
          indent_sales: indentSalesValue,
          expenses: expensesValue
        };
        
        console.log("Setting form data:", formValues);
        
        setFormData(formValues);
      } else {
        console.log("No reading data found for this shift");
        toast({
          title: "Warning",
          description: "No reading data found for this shift.",
          variant: "default"
        });
      }
    } catch (err) {
      console.error('Error loading completed shift data:', err);
      setError("Failed to load shift data. Please try again.");
      return Promise.reject(err);
    }
  }, []);

  // Implement a robust retry mechanism with exponential backoff
  useEffect(() => {
    const loadShiftData = async () => {
      if (!shiftId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        await checkShiftStatus();
      } catch (error) {
        console.error("Error in loadShiftData:", error);
        
        if (retryCount < maxRetries) {
          const nextRetry = retryCount + 1;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) + Math.random() * 1000;
          
          console.log(`Retrying shift data load (${nextRetry}/${maxRetries}) after ${delay.toFixed(0)}ms`);
          setLoadingMessage(`Loading data (retry ${nextRetry}/${maxRetries})...`);
          setRetryCount(nextRetry);
          
          setTimeout(() => {
            loadShiftData();
          }, delay);
        } else {
          setError("Failed to load shift data after multiple attempts. Please try again later.");
          setIsDataLoaded(true); // Mark as loaded even though there was an error
          
          toast({
            title: "Error",
            description: "Failed to load shift data after multiple attempts.",
            variant: "destructive"
          });
        }
      } finally {
        if (retryCount >= maxRetries) {
          setLoading(false);
        }
      }
    };
    
    if (shiftId && !isDataLoaded) {
      loadShiftData();
    }
  }, [shiftId, retryCount, isDataLoaded, checkShiftStatus, maxRetries]);

  // Fetch fuel price for calculations
  useEffect(() => {
    const fetchFuelPrice = async () => {
      try {
        setLoadingMessage('Fetching fuel prices...');
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('current_price')
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setFuelPrice(data[0].current_price);
        }
      } catch (err) {
        console.error('Error fetching fuel price:', err);
      }
    };
    
    fetchFuelPrice();
  }, []);
  
  // Fetch staff list for new shift
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoadingMessage('Loading staff data...');
        const { data, error } = await supabase
          .from('staff')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setStaffList(data);
        }
      } catch (err) {
        console.error('Error fetching staff:', err);
      }
    };
    
    if (mode === 'end-and-start' && !isEditingCompletedShift) {
      fetchStaff();
    }
  }, [mode, isEditingCompletedShift]);

  // Calculate total sales amount
  useEffect(() => {
    const cardSales = Number(formData.card_sales) || 0;
    const upiSales = Number(formData.upi_sales) || 0;
    const cashSales = Number(formData.cash_sales) || 0;
    const indentSales = Number(formData.indent_sales) || 0;
    
    const total = cardSales + upiSales + cashSales + indentSales;
    setTotalSales(total);
    
    // Debug log for sales calculation
    console.log("Calculated sales:", { cardSales, upiSales, cashSales, indentSales, total });
  }, [formData.card_sales, formData.upi_sales, formData.cash_sales, formData.indent_sales]);
  
  // Calculate cash reconciliation
  useEffect(() => {
    if (formData.closing_reading > 0 && openingReading > 0 && fuelPrice > 0) {
      const fuelSold = formData.closing_reading - openingReading;
      const expectedSales = fuelSold * fuelPrice;
      const expectedCash = formData.cash_sales;
      const actualCash = formData.cash_remaining;
      const expenses = formData.expenses || 0;
      const difference = actualCash - expectedCash + expenses;
      
      setCashReconciliation({
        expected: expectedCash,
        difference: difference
      });
    }
  }, [formData.closing_reading, formData.cash_sales, formData.cash_remaining, formData.expenses, openingReading, fuelPrice]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convert to number but handle empty string
    const numericValue = value === '' ? '' : parseFloat(value) || 0;
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
    
    console.log(`Form field "${name}" updated to:`, numericValue);
  };
  
  // Handle new shift input changes
  const handleNewShiftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? '' : parseFloat(value) || 0;
    
    setNewShiftData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };
  
  // Handle staff selection change for new shift
  const handleStaffChange = (value: string) => {
    setNewShiftData(prev => ({
      ...prev,
      staff_id: value
    }));
  };
  
  // Validate form before submission
  const validateForm = () => {
    setError(null);
    
    if (!isEditingCompletedShift) {
      if (!formData.closing_reading || formData.closing_reading <= openingReading) {
        setError("Closing reading must be greater than opening reading");
        return false;
      }
    } else {
      if (!formData.closing_reading || formData.closing_reading <= 0) {
        setError("Please enter a valid closing reading");
        return false;
      }
    }
    
    if (mode === 'end-and-start' && !newShiftData.staff_id) {
      setError("Please select a staff member for the new shift");
      return false;
    }
    
    return true;
  };

  // Form submission handler with improved error handling
  const handleSubmit = async () => {
    if (!validateForm()) return false;
    
    setLoading(true);
    setError(null);
    setLoadingMessage('Processing...');
    
    try {
      if (isEditingCompletedShift) {
        await updateCompletedShift();
        toast({
          title: "Success",
          description: "Shift details updated successfully."
        });
      } else {
        await endCurrentShift();
        toast({
          title: "Success",
          description: mode === 'end-only' 
            ? "Shift ended successfully." 
            : "Shift ended and new shift started successfully."
        });
      }
      
      onComplete();
      return true;
    } catch (error: any) {
      console.error('Error processing shift:', error);
      const errorMessage = error.message || "Failed to process shift. Please try again.";
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to process shift. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update a completed shift
  const updateCompletedShift = async () => {
    if (!shiftId) {
      throw new Error("Missing shift ID");
    }
    
    // Get existing readings to check schema
    const { data: existingReadings, error: readingsCheckError } = await supabase
      .from('readings')
      .select('*')
      .eq('shift_id', shiftId)
      .limit(1);
      
    if (readingsCheckError) {
      console.error('Supabase error fetching existing readings:', readingsCheckError);
      throw readingsCheckError;
    }
    
    // Properly typed existingReadings array to accommodate indent_sales
    const typedExistingReadings = existingReadings as ReadingData[] | null;
    
    // Check if indent_sales column exists in the readings table
    const hasIndentSalesColumn = typedExistingReadings && 
      typedExistingReadings.length > 0 && 
      'indent_sales' in typedExistingReadings[0];
    
    // Prepare update data for readings
    const baseUpdateData: Record<string, any> = {
      closing_reading: formData.closing_reading,
      cash_remaining: formData.cash_remaining,
      card_sales: formData.card_sales,
      upi_sales: formData.upi_sales,
      cash_sales: formData.cash_sales,
      expenses: formData.expenses
    };
    
    // Only add indent_sales if the column exists
    if (hasIndentSalesColumn) {
      baseUpdateData.indent_sales = formData.indent_sales;
    }
    
    console.log("Updating readings with data:", baseUpdateData);
    
    // Update readings
    const { error: updateError } = await supabase
      .from('readings')
      .update(baseUpdateData)
      .eq('shift_id', shiftId);
      
    if (updateError) {
      console.error('Supabase error updating readings:', updateError);
      throw updateError;
    }
  };

  // End the current shift
  const endCurrentShift = async () => {
    const now = new Date().toISOString();
    
    // Update the shift record
    const { error: shiftError } = await supabase
      .from('shifts')
      .update({
        end_time: now,
        status: 'completed',
        cash_remaining: formData.cash_remaining
      })
      .eq('id', shiftId);
      
    if (shiftError) {
      console.error('Supabase error updating shift:', shiftError);
      throw shiftError;
    }
    
    // Get existing readings to check schema
    const { data: existingReadings, error: readingsCheckError } = await supabase
      .from('readings')
      .select('*')
      .eq('shift_id', shiftId)
      .limit(1);
      
    if (readingsCheckError) {
      console.error('Supabase error fetching existing readings:', readingsCheckError);
      throw readingsCheckError;
    }
    
    // Properly typed existingReadings array to accommodate indent_sales
    const typedExistingReadings = existingReadings as ReadingData[] | null;
    
    // Check if indent_sales column exists in the readings table
    const hasIndentSalesColumn = typedExistingReadings && 
      typedExistingReadings.length > 0 && 
      'indent_sales' in typedExistingReadings[0];
    
    // Prepare update data for readings
    const baseUpdateData: Record<string, any> = {
      closing_reading: formData.closing_reading,
      cash_remaining: formData.cash_remaining,
      card_sales: formData.card_sales,
      upi_sales: formData.upi_sales,
      cash_sales: formData.cash_sales,
      expenses: formData.expenses
    };
    
    // Only add indent_sales if the column exists
    if (hasIndentSalesColumn) {
      baseUpdateData.indent_sales = formData.indent_sales;
    }
    
    // Update readings
    const { error: updateError } = await supabase
      .from('readings')
      .update(baseUpdateData)
      .eq('shift_id', shiftId);
      
    if (updateError) {
      console.error('Supabase error updating readings:', updateError);
      throw updateError;
    }
    
    // If we're also starting a new shift
    if (mode === 'end-and-start' && newShiftData.staff_id) {
      await startNewShift(now);
    }
  };

  // Start a new shift
  const startNewShift = async (startTime: string) => {
    // Get current shift type to determine next shift type
    const { data: currentShift, error: currentShiftError } = await supabase
      .from('shifts')
      .select('shift_type')
      .eq('id', shiftId)
      .maybeSingle();
      
    if (currentShiftError) {
      console.error('Supabase error fetching current shift:', currentShiftError);
      throw currentShiftError;
    }
    
    let nextShiftType = 'day'; // Default
    
    // Determine next shift type based on current shift
    if (currentShift) {
      if (currentShift.shift_type === 'morning') {
        nextShiftType = 'evening';
      } else if (currentShift.shift_type === 'evening') {
        nextShiftType = 'night';
      } else if (currentShift.shift_type === 'night') {
        nextShiftType = 'morning';
      } else if (currentShift.shift_type === 'day') {
        nextShiftType = 'night';
      }
    }
    
    // Create a new shift
    const { data: newShift, error: newShiftError } = await supabase
      .from('shifts')
      .insert([{
        staff_id: newShiftData.staff_id,
        shift_type: nextShiftType,
        start_time: startTime,
        status: 'active'
      }])
      .select();
      
    if (newShiftError) {
      console.error('Supabase error creating new shift:', newShiftError);
      throw newShiftError;
    }
    
    if (!newShift || newShift.length === 0) {
      throw new Error("Failed to create new shift");
    }
    
    // Create associated reading record
    const { error: newReadingError } = await supabase
      .from('readings')
      .insert([{
        shift_id: newShift[0].id,
        staff_id: newShiftData.staff_id,
        pump_id: pumpId,
        date: newShiftData.date,
        opening_reading: formData.closing_reading, // Use closing reading as opening reading
        cash_given: newShiftData.cash_given
      }]);
      
    if (newReadingError) {
      console.error('Supabase error creating new reading:', newReadingError);
      throw newReadingError;
    }
  };

  // Calculate fuel metrics for display
  const fuelLiters = formData.closing_reading - openingReading > 0 
    ? formData.closing_reading - openingReading 
    : 0;
  
  const expectedSalesAmount = fuelLiters * fuelPrice;

  return {
    mode,
    setMode,
    loading,
    error,
    formData,
    totalSales,
    cashReconciliation,
    newShiftData,
    staffList,
    isEditingCompletedShift,
    fuelLiters,
    expectedSalesAmount,
    openingReading,
    isDataLoaded,
    loadingMessage,
    handleInputChange,
    handleNewShiftInputChange,
    handleStaffChange,
    handleSubmit
  };
}
