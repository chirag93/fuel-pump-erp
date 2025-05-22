
import { useState, useEffect } from 'react';
import { SelectedShiftData } from '@/types/shift';
import { useToast } from '@/hooks/use-toast';
import { normalizeFuelType } from '@/utils/fuelCalculations';
import { useShiftReadings } from './shift/useShiftReadings';
import { useShiftConsumables } from './shift/useShiftConsumables';
import { useShiftSales } from './shift/useShiftSales';
import { useShiftCash } from './shift/useShiftCash';
import { useShiftSubmit } from './shift/useShiftSubmit';
import { EndShiftFormData } from '@/types/shift-hooks';

export const useEndShiftDialog = (shiftData: SelectedShiftData, onComplete: () => void) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<EndShiftFormData>({
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
  
  // Use specialized hooks
  const {
    readings,
    fuelSalesByType,
    totalLiters,
    fuelRates,
    handleReadingChange
  } = useShiftReadings(shiftData.id);
  
  const {
    allocatedConsumables,
    returnedConsumables,
    consumablesExpense,
    updateReturnedConsumable
  } = useShiftConsumables(shiftData.id);
  
  const {
    salesData,
    totalSales,
    handleSalesChange,
    handleTestingFuelByTypeChange
  } = useShiftSales(shiftData.id, shiftData.staff_id);
  
  const {
    cashReconciliation
  } = useShiftCash(
    formData.cash_sales,
    formData.cash_remaining,
    formData.expenses
  );
  
  const {
    isProcessing,
    error,
    handleSubmit: submitShift
  } = useShiftSubmit(
    shiftData,
    formData,
    returnedConsumables,
    onComplete
  );
  
  // Synchronize data from specialized hooks to form data
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      readings: readings
    }));
  }, [readings]);
  
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      consumable_expenses: consumablesExpense
    }));
  }, [consumablesExpense]);
  
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      card_sales: salesData.card_sales,
      upi_sales: salesData.upi_sales,
      cash_sales: salesData.cash_sales,
      indent_sales: salesData.indent_sales,
      testing_fuel: salesData.testing_fuel,
      testing_fuel_by_type: salesData.testing_fuel_by_type
    }));
  }, [salesData]);
  
  // Input change handlers
  const handleInputChange = (field: keyof EndShiftFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle submit wrapping the specialized submit hook
  const handleSubmit = async () => {
    return await submitShift();
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
