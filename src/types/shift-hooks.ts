
import { AllocatedConsumable, ReturnedConsumablesMap } from '@/components/shift/EndShiftConsumables';

// Reading-related types
export interface FuelReading {
  fuel_type: string;
  opening_reading: number;
  closing_reading: number;
}

export interface FuelUsageByType {
  [key: string]: number;
}

// Sales and financial types
export interface CashReconciliation {
  expected: number;
  difference: number;
}

export interface ShiftSalesData {
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  indent_sales: number;
  testing_fuel: number;
  testing_fuel_by_type?: Record<string, number>;
}

// Form data interface
export interface EndShiftFormData {
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
