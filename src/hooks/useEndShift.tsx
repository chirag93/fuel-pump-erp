
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SelectedConsumable } from '@/components/shift/ConsumableSelection';
import { SelectedShiftData } from '@/types/shift';
import { getFuelPumpId } from '@/integrations/utils';

export interface EndShiftFormData {
  closingReading: string;
  cashRemaining: string;
  expenses: string;
  testingFuel: string;
  cardSales: string;
  upiSales: string;
  cashSales: string;
  selectedStaff: string;
  createNewShift: boolean;
}

export function useEndShift(shiftData: SelectedShiftData | null, onShiftEnded: () => void, onClose: () => void) {
  const [formData, setFormData] = useState<EndShiftFormData>({
    closingReading: '',
    cashRemaining: '',
    expenses: '',
    testingFuel: '0',
    cardSales: '',
    upiSales: '',
    cashSales: '',
    selectedStaff: '',
    createNewShift: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  
  const [cashReconciliation, setCashReconciliation] = useState({
    expected: 0,
    difference: 0
  });
  
  const [allocatedConsumables, setAllocatedConsumables] = useState<SelectedConsumable[]>([]);
  const [returnedConsumables, setReturnedConsumables] = useState<SelectedConsumable[]>([]);
  const [consumablesExpense, setConsumablesExpense] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  
  // Get the fuel pump ID once
  useEffect(() => {
    const fetchFuelPumpId = async () => {
      try {
        const pumpId = await getFuelPumpId();
        if (pumpId) {
          setFuelPumpId(pumpId);
          console.log('Fetched fuel pump ID:', pumpId);
        }
      } catch (err) {
        console.error('Error fetching fuel pump ID:', err);
      }
    };
    
    fetchFuelPumpId();
  }, []);
  
  // Calculate total sales whenever sales input changes
  useEffect(() => {
    const card = Number(formData.cardSales) || 0;
    const upi = Number(formData.upiSales) || 0;
    const cash = Number(formData.cashSales) || 0;
    setTotalSales(card + upi + cash);
  }, [formData.cardSales, formData.upiSales, formData.cashSales]);
  
  // Fetch fuel price for calculations
  useEffect(() => {
    const fetchFuelPrice = async () => {
      try {
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
  
  // Calculate cash reconciliation
  useEffect(() => {
    if (Number(formData.closingReading) > 0 && shiftData?.opening_reading > 0 && fuelPrice > 0) {
      const expectedCash = Number(formData.cashSales) || 0;
      const actualCash = Number(formData.cashRemaining) || 0;
      const expensesAmount = Number(formData.expenses) || 0;
      const difference = actualCash - expectedCash + expensesAmount;
      
      setCashReconciliation({
        expected: expectedCash,
        difference: difference
      });
    }
  }, [formData.closingReading, formData.cashSales, formData.cashRemaining, formData.expenses, shiftData?.opening_reading, fuelPrice]);

  // Reset form when dialog opens
  useEffect(() => {
    if (shiftData) {
      setFormData({
        closingReading: '',
        cashRemaining: '',
        expenses: '',
        testingFuel: '0',
        cardSales: '',
        upiSales: '',
        cashSales: '',
        selectedStaff: '',
        createNewShift: true
      });
      setError(null);
      setValidationErrors({});
    }
  }, [shiftData]);

  // Load staff list
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        if (!fuelPumpId) {
          console.warn('No fuel pump ID available for staff fetch');
          return;
        }
        
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, role, assigned_pumps, staff_numeric_id')
          .eq('fuel_pump_id', fuelPumpId)
          .eq('is_active', true)
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          console.log('Staff loaded:', data.length);
          setStaff(data);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error loading staff",
          description: "Could not load staff list. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    if (shiftData && fuelPumpId) {
      fetchStaff();
    }
  }, [shiftData, fuelPumpId]);
  
  // Add function to fetch allocated consumables
  useEffect(() => {
    if (shiftData?.id) {
      const fetchAllocatedConsumables = async () => {
        try {
          console.log('Fetching consumables for shift:', shiftData.id);
          const { data, error } = await supabase
            .from('shift_consumables')
            .select(`
              consumable_id,
              quantity_allocated,
              consumables (
                id,
                name,
                unit,
                price_per_unit
              )
            `)
            .eq('shift_id', shiftData.id)
            .eq('status', 'allocated');

          if (error) throw error;

          console.log('Fetch consumables response:', data);

          if (data && data.length > 0) {
            const allocatedItems = data.map(item => ({
              id: item.consumables.id,
              name: item.consumables.name,
              quantity: item.quantity_allocated,
              available: item.quantity_allocated, // This is the max that can be returned
              price_per_unit: item.consumables.price_per_unit,
              unit: item.consumables.unit || 'units'
            }));
            
            console.log('Processed allocated items:', allocatedItems);
            setAllocatedConsumables(allocatedItems);
            
            // Initialize returned consumables with zero to start with
            setReturnedConsumables(allocatedItems.map(item => ({
              ...item,
              quantity: 0 // Default to returning none - user will specify
            })));
          } else {
            setAllocatedConsumables([]);
            setReturnedConsumables([]);
          }
        } catch (error) {
          console.error('Error fetching allocated consumables:', error);
          toast({
            title: "Error",
            description: "Failed to load allocated consumables",
            variant: "destructive"
          });
        }
      };

      fetchAllocatedConsumables();
    } else {
      setAllocatedConsumables([]);
      setReturnedConsumables([]);
    }
  }, [shiftData?.id]);
  
  // Update function to calculate consumables sold revenue
  useEffect(() => {
    if (allocatedConsumables.length > 0 && returnedConsumables.length > 0) {
      // Calculate consumables revenue - only count sold items (allocated minus returned)
      const revenue = allocatedConsumables.reduce((total, allocated) => {
        const returned = returnedConsumables.find(r => r.id === allocated.id);
        const soldQuantity = allocated.quantity - (returned?.quantity || 0);
        return total + (soldQuantity * allocated.price_per_unit);
      }, 0);
      
      setConsumablesExpense(revenue);
    } else {
      setConsumablesExpense(0);
    }
  }, [allocatedConsumables, returnedConsumables]);

  const validateForm = () => {
    const errors: Record<string, boolean> = {};
    let hasError = false;
    setError(null);
    
    if (!formData.closingReading || Number(formData.closingReading) <= 0) {
      errors.closingReading = true;
      hasError = true;
    }
    
    if (shiftData && Number(formData.closingReading) <= shiftData.opening_reading) {
      errors.closingReading = true;
      hasError = true;
      setError('Closing reading must be greater than opening reading');
    }
    
    if (!formData.cashRemaining || Number(formData.cashRemaining) < 0) {
      errors.cashRemaining = true;
      hasError = true;
    }
    
    if (formData.createNewShift && !formData.selectedStaff) {
      errors.selectedStaff = true;
      hasError = true;
      setError('Please select a staff member for the new shift');
    }
    
    setValidationErrors(errors);
    return !hasError;
  };

  const handleEndShift = async () => {
    if (!validateForm() || !shiftData) return;
    
    setIsLoading(true);
    
    try {
      const now = new Date();
      
      // 1. Update current shift to mark it as completed
      const { error: updateShiftError } = await supabase
        .from('shifts')
        .update({
          end_time: now.toISOString(),
          status: 'completed',
          cash_remaining: Number(formData.cashRemaining)
        })
        .eq('id', shiftData.id);
      
      if (updateShiftError) throw updateShiftError;
      
      // 2. Update readings with closing reading, sales data, and consumables sold
      const { error: updateReadingError } = await supabase
        .from('readings')
        .update({
          closing_reading: Number(formData.closingReading),
          card_sales: Number(formData.cardSales) || 0,
          upi_sales: Number(formData.upiSales) || 0,
          cash_sales: Number(formData.cashSales) || 0,
          cash_remaining: Number(formData.cashRemaining),
          expenses: Number(formData.expenses) || 0,
          testing_fuel: Number(formData.testingFuel) || 0,
          consumable_expenses: consumablesExpense // This is actually revenue from consumables sold
        })
        .eq('shift_id', shiftData.id);
      
      if (updateReadingError) throw updateReadingError;
      
      // Handle consumable returns
      if (allocatedConsumables.length > 0) {
        for (const returned of returnedConsumables) {
          const allocated = allocatedConsumables.find(a => a.id === returned.id);
          if (!allocated) continue;
          
          // Get current quantity from consumables table
          const { data: consumableData, error: getConsumableError } = await supabase
            .from('consumables')
            .select('quantity')
            .eq('id', returned.id)
            .single();
            
          if (getConsumableError) throw getConsumableError;
          
          if (!consumableData) {
            throw new Error(`Consumable with ID ${returned.id} not found`);
          }
          
          // Calculate returned quantity and update inventory
          const returnQuantity = returned.quantity || 0;
          const newQuantity = consumableData.quantity + returnQuantity;
          
          // Update inventory with the new quantity
          const { error: inventoryError } = await supabase
            .from('consumables')
            .update({ quantity: newQuantity })
            .eq('id', returned.id);

          if (inventoryError) throw inventoryError;

          // Update shift_consumables status and returned quantity
          const { error: shiftConsumableError } = await supabase
            .from('shift_consumables')
            .update({ 
              status: 'returned',
              quantity_returned: returnQuantity
            })
            .eq('shift_id', shiftData.id)
            .eq('consumable_id', returned.id);

          if (shiftConsumableError) throw shiftConsumableError;
        }
      }
      
      // 3. Create new shift if required
      if (formData.createNewShift && formData.selectedStaff) {
        // Determine next shift type based on current shift
        let nextShiftType = 'day'; // Default
        
        if (shiftData.shift_type === 'morning') {
          nextShiftType = 'evening';
        } else if (shiftData.shift_type === 'evening') {
          nextShiftType = 'night';
        } else if (shiftData.shift_type === 'night') {
          nextShiftType = 'morning';
        } else if (shiftData.shift_type === 'day') {
          nextShiftType = 'night';
        }
        
        console.log('Creating new shift with fuel_pump_id:', fuelPumpId);
        
        // Create new shift
        const { data: newShiftData, error: newShiftError } = await supabase
          .from('shifts')
          .insert([{
            staff_id: formData.selectedStaff,
            shift_type: nextShiftType,
            start_time: now.toISOString(),
            status: 'active',
            fuel_pump_id: fuelPumpId
          }])
          .select();
        
        if (newShiftError) {
          console.error('Error creating new shift:', newShiftError);
          throw newShiftError;
        }
        
        if (newShiftData && newShiftData.length > 0) {
          console.log('New shift created:', newShiftData[0].id);
          
          // Create new reading for the new shift
          const { error: newReadingError } = await supabase
            .from('readings')
            .insert([{
              shift_id: newShiftData[0].id,
              staff_id: formData.selectedStaff,
              pump_id: shiftData.pump_id,
              date: now.toISOString().split('T')[0],
              opening_reading: Number(formData.closingReading),
              fuel_pump_id: fuelPumpId
            }]);
          
          if (newReadingError) {
            console.error('Error creating new reading:', newReadingError);
            throw newReadingError;
          }
          
          console.log('New reading created successfully');
        } else {
          throw new Error('Failed to create new shift - no data returned');
        }
      }
      
      toast({
        title: "Shift ended successfully",
        description: formData.createNewShift ? 
          "Current shift ended and new shift started successfully" : 
          "Shift ended successfully",
      });
      
      // Call the callback to refresh the shifts list
      onShiftEnded();
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error ending shift",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate fuel quantities
  const testingFuelAmount = Number(formData.testingFuel) || 0;
  const fuelLiters = Number(formData.closingReading) - (shiftData?.opening_reading || 0) > 0 
    ? Number(formData.closingReading) - (shiftData?.opening_reading || 0) - testingFuelAmount
    : 0;

  // Calculate expected sales amount
  const expectedSalesAmount = fuelLiters * fuelPrice;
  
  const updateFormData = (field: keyof EndShiftFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };
  
  const updateReturnedConsumable = (id: string, quantity: number) => {
    console.log('Updating returned consumable:', id, quantity);
    setReturnedConsumables(prev => {
      const existing = prev.findIndex(r => r.id === id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantity
        };
        return updated;
      } else {
        const consumable = allocatedConsumables.find(c => c.id === id);
        if (!consumable) return prev;
        
        return [
          ...prev,
          {
            ...consumable,
            quantity
          }
        ];
      }
    });
  };

  return {
    formData,
    updateFormData,
    isLoading,
    error,
    staff,
    fuelPrice,
    totalSales,
    allocatedConsumables,
    returnedConsumables,
    updateReturnedConsumable,
    consumablesExpense,
    cashReconciliation,
    handleEndShift,
    testingFuelAmount,
    fuelLiters,
    expectedSalesAmount,
    validationErrors
  };
}
