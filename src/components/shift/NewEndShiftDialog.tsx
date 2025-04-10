
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectedShiftData, ShiftReading } from '@/types/shift';
import { EndShiftReadings, FuelReading } from './EndShiftReadings';
import { EndShiftSales, SalesFormData } from './EndShiftSales';
import { EndShiftCashExpenses } from './EndShiftCashExpenses';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EndShiftConsumables } from './EndShiftConsumables';
import { SelectedConsumable } from '@/components/shift/ConsumableSelection';

// Define a specific interface for the form data to avoid deep instantiation
interface EndShiftFormData {
  readings: FuelReading[];
  cash_remaining: number;
  expenses: number;
  consumable_expenses: number;
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  testing_fuel: number;
}

interface NewEndShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: SelectedShiftData;
  onShiftEnded: () => void;
}

export function NewEndShiftDialog({
  isOpen,
  onClose,
  shiftData,
  onShiftEnded
}: NewEndShiftDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<EndShiftFormData>({
    readings: [],
    cash_remaining: 0,
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    testing_fuel: 0,
    expenses: 0,
    consumable_expenses: 0
  });

  // Consumables state
  const [allocatedConsumables, setAllocatedConsumables] = useState<SelectedConsumable[]>([]);
  const [returnedConsumables, setReturnedConsumables] = useState<SelectedConsumable[]>([]);
  const [consumablesExpense, setConsumablesExpense] = useState<number>(0);

  // Derived calculations
  const totalSales = formData.card_sales + formData.upi_sales + formData.cash_sales;
  const totalLiters = formData.readings.reduce((sum, reading) => {
    return sum + Math.max(0, reading.closing_reading - reading.opening_reading);
  }, 0);
  
  // Fuel-type specific sales calculations
  const [fuelSalesByType, setFuelSalesByType] = useState<Record<string, number>>({});
  const [fuelRates, setFuelRates] = useState<Record<string, number>>({});
  
  // Fetch fuel rates from database
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);
  
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
  
  // Cash reconciliation
  const [cashReconciliation, setCashReconciliation] = useState({
    expected: 0,
    difference: 0
  });

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

  useEffect(() => {
    if (isOpen && shiftData) {
      fetchShiftReadings();
      fetchShiftConsumables();
    }
  }, [isOpen, shiftData]);

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
        
      if (allocationsError) throw allocationsError;
      
      if (allocations && allocations.length > 0) {
        const allocated: SelectedConsumable[] = allocations.map((item: any) => ({
          id: item.consumable_id,
          name: item.consumables?.name || 'Unknown',
          unit: item.consumables?.unit || 'Units',
          price_per_unit: item.consumables?.price_per_unit || 0,
          quantity: item.quantity_allocated || 0
        }));
        
        // Initialize returned consumables with the same items but use returned quantity if available
        const returned: SelectedConsumable[] = allocations.map((item: any) => ({
          id: item.consumable_id,
          name: item.consumables?.name || 'Unknown',
          unit: item.consumables?.unit || 'Units',
          price_per_unit: item.consumables?.price_per_unit || 0,
          quantity: item.quantity_returned || 0
        }));
        
        setAllocatedConsumables(allocated);
        setReturnedConsumables(returned);
        
        // Calculate initial consumable expenses
        calculateConsumableExpenses(allocated, returned);
      }
    } catch (error) {
      console.error('Error fetching shift consumables:', error);
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
    
    setConsumablesExpense(totalExpense);
    setFormData(prev => ({
      ...prev,
      consumable_expenses: totalExpense
    }));
  };

  // Update returned consumable quantity
  const updateReturnedConsumable = (id: string, quantity: number) => {
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
          // Update existing reading
          const { error: readingError } = await supabase
            .from('readings')
            .update({
              closing_reading: reading.closing_reading,
              cash_remaining: formData.cash_remaining,
              card_sales: formData.card_sales,
              upi_sales: formData.upi_sales,
              cash_sales: formData.cash_sales,
              testing_fuel: formData.testing_fuel,
              expenses: formData.expenses,
              consumable_expenses: formData.consumable_expenses
            })
            .eq('shift_id', shiftData.id)
            .eq('fuel_type', reading.fuel_type);
            
          if (readingError) throw readingError;
        } else {
          // Create new reading if it doesn't exist
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
                status: 'completed'
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
      onClose();
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error",
        description: "Failed to end shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(80vh-120px)]">
          <div className="grid gap-6 py-4 pr-4">
            <div className="grid gap-2">
              <h3 className="font-semibold text-lg">Shift Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Staff:</p>
                  <p className="font-medium">{shiftData.staff_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pump:</p>
                  <p className="font-medium">{shiftData.pump_id || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Readings Section */}
            {formData.readings.length > 0 ? (
              <EndShiftReadings 
                readings={formData.readings}
                onReadingChange={handleReadingChange}
              />
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground">No meter readings available for this shift</p>
              </div>
            )}
            
            {/* Sales Section with fuel rates */}
            <EndShiftSales
              salesData={{
                card_sales: formData.card_sales,
                upi_sales: formData.upi_sales,
                cash_sales: formData.cash_sales,
                testing_fuel: formData.testing_fuel
              }}
              onSalesChange={handleSalesChange}
              totalSales={totalSales}
              totalLiters={totalLiters}
              fuelSalesByType={fuelSalesByType}
              fuelRates={fuelRates}
            />
            
            {/* Consumables Section */}
            {allocatedConsumables.length > 0 && (
              <EndShiftConsumables
                allocatedConsumables={allocatedConsumables}
                returnedConsumables={returnedConsumables}
                updateReturnedConsumable={updateReturnedConsumable}
                consumablesExpense={consumablesExpense}
              />
            )}
            
            {/* Expenses Section */}
            <div className="grid gap-4">
              <h3 className="font-semibold">Expenses</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expenses">Expenses (INR)</Label>
                  <Input
                    id="expenses"
                    type="number"
                    value={formData.expenses || ''}
                    onChange={(e) => handleInputChange('expenses', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="consumable_expenses">Consumable Sales (INR)</Label>
                  <Input
                    id="consumable_expenses"
                    type="number"
                    value={formData.consumable_expenses}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated from consumable reconciliation
                  </p>
                </div>
              </div>
            </div>
            
            {/* Cash Section */}
            <EndShiftCashExpenses
              expenses={formData.expenses.toString()}
              setExpenses={(value) => handleInputChange('expenses', parseFloat(value) || 0)}
              cashRemaining={formData.cash_remaining.toString()}
              setCashRemaining={(value) => handleInputChange('cash_remaining', parseFloat(value) || 0)}
              cashSales={formData.cash_sales.toString()}
              cashReconciliation={cashReconciliation}
            />
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "End Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
