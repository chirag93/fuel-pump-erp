
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectedShiftData } from '@/types/shift';
import { EndShiftReadings, FuelReading } from './EndShiftReadings';
import { EndShiftSales } from './EndShiftSales';
import { EndShiftCashExpenses } from './EndShiftCashExpenses';

// Simple explicit type for readings
interface ReadingData {
  id?: string;
  fuel_type: string;
  opening_reading: number;
  closing_reading: number | null;
  shift_id?: string;
  staff_id?: string;
  pump_id?: string;
  date?: string;
}

// Fixed form data type with explicit fields
interface FormData {
  readings: FuelReading[];
  cash_remaining: number;
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  testing_fuel: number;
  expenses: number;
  consumable_expenses: number;
}

// Sales form data type for the EndShiftSales component
export interface SalesFormData {
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
  
  // Explicitly typed state
  const [formData, setFormData] = useState<FormData>({
    readings: [],
    cash_remaining: 0,
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    testing_fuel: 0,
    expenses: 0,
    consumable_expenses: 0
  });

  // Derived calculations
  const totalSales = formData.card_sales + formData.upi_sales + formData.cash_sales;
  const totalLiters = formData.readings.reduce((sum, reading) => {
    return sum + Math.max(0, reading.closing_reading - reading.opening_reading);
  }, 0);
  
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
      
      if (data) {
        // Safely map the data to our FuelReading[] type
        const fuelReadings: FuelReading[] = data.map((reading: any) => ({
          fuel_type: reading.fuel_type,
          opening_reading: reading.opening_reading,
          closing_reading: reading.closing_reading || reading.opening_reading
        }));
        
        // Update state with the explicitly typed readings
        setFormData(prev => ({
          ...prev,
          readings: fuelReadings
        }));
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

  // Handler for reading changes - explicitly typed
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

  // Fixed handler for sales and other numeric inputs
  const handleInputChange = (field: keyof Omit<FormData, 'readings'>, value: number) => {
    // Create a new object to avoid deep nesting issues
    const newFormData = { ...formData };
    newFormData[field] = value;
    setFormData(newFormData);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <h3 className="font-semibold text-lg">Shift Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Staff:</p>
                <p className="font-medium">{shiftData.staff_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pump:</p>
                <p className="font-medium">{shiftData.pump_id}</p>
              </div>
            </div>
          </div>
          
          {/* Readings Section */}
          <EndShiftReadings 
            readings={formData.readings}
            onReadingChange={handleReadingChange}
          />
          
          {/* Sales Section */}
          <EndShiftSales
            salesData={{
              card_sales: formData.card_sales,
              upi_sales: formData.upi_sales,
              cash_sales: formData.cash_sales,
              testing_fuel: formData.testing_fuel
            }}
            onSalesChange={(field, value) => handleInputChange(field as keyof Omit<FormData, 'readings'>, value)}
            totalSales={totalSales}
            totalLiters={totalLiters}
          />
          
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
                <Label htmlFor="consumable_expenses">Consumable Expenses (INR)</Label>
                <Input
                  id="consumable_expenses"
                  type="number"
                  value={formData.consumable_expenses || ''}
                  onChange={(e) => handleInputChange('consumable_expenses', parseFloat(e.target.value) || 0)}
                />
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
