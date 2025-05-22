
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EndShiftFormData } from '@/types/shift-hooks';
import { ReturnedConsumablesMap } from '@/components/shift/EndShiftConsumables';
import { SelectedShiftData } from '@/types/shift';

export function useShiftSubmit(
  shiftData: SelectedShiftData,
  formData: EndShiftFormData,
  returnedConsumables: ReturnedConsumablesMap,
  onComplete: () => void
) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (formData.readings.some(r => !r.closing_reading || r.closing_reading <= r.opening_reading)) {
      setError('All closing readings must be greater than opening readings');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return false;
    
    try {
      setIsProcessing(true);
      setError(null);
      
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
        const fuelType = reading.fuel_type;
        
        // Ensure fuelType is a string when used as an object key
        const fuelTypeStr = String(fuelType);
        const testingFuelForType = formData.testing_fuel_by_type?.[fuelTypeStr] || 0;
        
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
    isProcessing,
    error,
    handleSubmit
  };
}
