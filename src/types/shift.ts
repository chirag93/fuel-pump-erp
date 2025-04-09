
export interface Shift {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_numeric_id?: string;
  shift_type: string;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'completed';
  date: string;
  pump_id: string;
  opening_reading?: number; // Make optional as we're using all_readings now
  closing_reading?: number | null; // Make optional as we're using all_readings now
  starting_cash_balance: number;
  ending_cash_balance: number | null;
  card_sales: number | null;
  upi_sales: number | null;
  cash_sales: number | null;
  testing_fuel: number | null;
  created_at?: string | null;
  fuel_pump_id?: string;
  all_readings?: ShiftReading[];
}

export interface ShiftReading {
  fuel_type: string;
  opening_reading: number;
  closing_reading: number | null;
}

export interface Staff {
  id: string;
  name: string;
  staff_numeric_id?: string;
  role?: string;
}

export interface CurrentShiftData {
  staffId: string;
  pumpId: string;
  openingReading: number;
}

export interface SelectedShiftData {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_numeric_id?: string;
  pump_id: string;
  opening_reading: number;
  shift_type: string;
  all_readings?: ShiftReading[];
}
