
export interface Shift {
  id: string;
  staff_id: string;
  staff_name: string;
  shift_type: string;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'completed';
  date: string;
  pump_id: string;
  opening_reading: number;
  closing_reading: number | null;
  starting_cash_balance: number;
  ending_cash_balance: number | null;
  card_sales: number | null;
  upi_sales: number | null;
  cash_sales: number | null;
  testing_fuel: number | null;
  created_at?: string | null;
}

export interface Staff {
  id: string;
  name: string;
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
  pump_id: string;
  opening_reading: number;
  shift_type: string;
}
