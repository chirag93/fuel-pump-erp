
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { SelectedConsumable } from '@/components/shift/ConsumableSelection';
import { SelectedShiftData } from '@/types/shift';

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
  
  const [cashReconciliation, setCashReconciliation] = useState({
    expected: 0,
    difference: 0
  });
  
  const [allocatedConsumables, setAllocatedConsumables] = useState<SelectedConsumable[]>([]);
  const [returnedConsumables, setReturnedConsumables] = useState<SelectedConsumable[]>([]);
  const [consumablesExpense, setConsumablesExpense] = useState(0);
  
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
    }
  }, [shiftData]);

  // Load staff list
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, role, assigned_pumps')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
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
    
    if (shiftData) {
      fetchStaff();
    }
  }, [shiftData]);
  
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
  
  // Add function to calculate consumables expense
  useEffect(() => {
    if (allocatedConsumables.length > 0 && returnedConsumables.length > 0) {
      // Calculate consumables expense - only count consumed items (allocated minus returned)
      const expense = allocatedConsumables.reduce((total, allocated) => {
        const returned = returnedConsumables.find(r => r.id === allocated.id);
        const usedQuantity = allocated.quantity - (returned?.quantity || 0);
        return total + (usedQuantity * allocated.price_per_unit);
      }, 0);
      
      setConsumablesExpense(expense);
    } else {
      setConsumablesExpense(0);
    }
  }, [allocatedConsumables, returnedConsumables]);

  const validateForm = () => {
    setError(null);
    
    if (!formData.closingReading || Number(formData.closingReading) <= 0) {
      setError('Please enter a valid closing reading');
      return false;
    }
    
    if (shiftData && Number(formData.closingReading) <= shiftData.opening_reading) {
      setError('Closing reading must be greater than opening reading');
      return false;
    }
    
    if (!formData.cashRemaining || Number(formData.cashRemaining) < 0) {
      setError('Please enter a valid cash remaining amount');
      return false;
    }
    
    if (formData.createNewShift && !formData.selectedStaff) {
      setError('Please select a staff member for the new shift');
      return false;
    }
    
    return true;
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
      
      // 2. Update readings with closing reading, sales data, and consumables expense
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
          consumable_expenses: consumablesExpense
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
        
        // Create new shift
        const { data: newShiftData, error: newShiftError } = await supabase
          .from('shifts')
          .insert([{
            staff_id: formData.selectedStaff,
            shift_type: nextShiftType,
            start_time: now.toISOString(),
            status: 'active'
          }])
          .select();
        
        if (newShiftError) throw newShiftError;
        
        if (newShiftData && newShiftData.length > 0) {
          // Create new reading for the new shift
          const { error: newReadingError } = await supabase
            .from('readings')
            .insert([{
              shift_id: newShiftData[0].id,
              staff_id: formData.selectedStaff,
              pump_id: shiftData.pump_id,
              date: now.toISOString().split('T')[0],
              opening_reading: Number(formData.closingReading)
            }]);
          
          if (newReadingError) throw newReadingError;
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
    expectedSalesAmount
  };
}
