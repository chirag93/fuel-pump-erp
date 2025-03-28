
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { getFuelPumpId } from "@/integrations/utils";

interface ChartDataPoint {
  name: string;
  total: number;
  [key: string]: any;
}

interface FuelVolume {
  name: string;
  petrol: number;
  diesel: number;
  [key: string]: any;
}

interface DashboardMetrics {
  totalSales: string;
  customers: string;
  fuelVolume: string;
  growth: string;
}

// Function to get sales data for bar chart
export const getSalesData = async (startDate: Date, endDate: Date): Promise<ChartDataPoint[]> => {
  try {
    // Get the current fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('getSalesData: No fuel pump ID available, cannot fetch sales data');
      return [];
    }
    
    console.log(`getSalesData: Fetching for fuel pump ${fuelPumpId}`);
    
    // Fetch transactions between the selected dates for this fuel pump
    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount, fuel_type')
      .eq('fuel_pump_id', fuelPumpId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true });
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`getSalesData: No data found for fuel pump ${fuelPumpId}`);
      return [];
    }
    
    console.log(`getSalesData: Found ${data.length} transactions for fuel pump ${fuelPumpId}`);
    
    // Group data by date
    const groupedByDate: Record<string, number> = {};
    
    data.forEach(transaction => {
      const dateStr = transaction.date;
      const formattedDate = format(new Date(dateStr), 'dd MMM');
      
      if (!groupedByDate[formattedDate]) {
        groupedByDate[formattedDate] = 0;
      }
      
      groupedByDate[formattedDate] += Number(transaction.amount) || 0;
    });
    
    // Convert to chart data format
    const chartData: ChartDataPoint[] = Object.keys(groupedByDate).map(date => ({
      name: date,
      total: Math.round(groupedByDate[date])
    }));
    
    return chartData;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};

// Function to get fuel volume data for line chart
export const getFuelVolumeData = async (startDate: Date, endDate: Date): Promise<FuelVolume[]> => {
  try {
    // Get the current fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('getFuelVolumeData: No fuel pump ID available, cannot fetch fuel data');
      return [];
    }
    
    console.log(`getFuelVolumeData: Fetching for fuel pump ${fuelPumpId}`);
    
    // Get daily readings data for the chart, filtered by fuel pump
    const { data, error } = await supabase
      .from('daily_readings')
      .select('date, fuel_type, sales_per_tank_stock')
      .eq('fuel_pump_id', fuelPumpId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true });
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      console.log(`getFuelVolumeData: No data found for fuel pump ${fuelPumpId}`);
      return [];
    }
    
    console.log(`getFuelVolumeData: Found ${data.length} readings for fuel pump ${fuelPumpId}`);
    
    // Group data by date and fuel type
    const groupedByDate: Record<string, { petrol: number, diesel: number }> = {};
    
    data.forEach(reading => {
      if (!reading.sales_per_tank_stock) return;
      
      const dateStr = reading.date;
      const formattedDate = format(new Date(dateStr), 'dd MMM');
      
      if (!groupedByDate[formattedDate]) {
        groupedByDate[formattedDate] = { petrol: 0, diesel: 0 };
      }
      
      if (reading.fuel_type.toLowerCase().includes('petrol')) {
        groupedByDate[formattedDate].petrol += Number(reading.sales_per_tank_stock) || 0;
      } else if (reading.fuel_type.toLowerCase().includes('diesel')) {
        groupedByDate[formattedDate].diesel += Number(reading.sales_per_tank_stock) || 0;
      }
    });
    
    // Convert to chart data format
    const chartData: FuelVolume[] = Object.keys(groupedByDate).map(date => ({
      name: date,
      petrol: Math.round(groupedByDate[date].petrol),
      diesel: Math.round(groupedByDate[date].diesel)
    }));
    
    return chartData;
  } catch (error) {
    console.error('Error fetching fuel volume data:', error);
    return [];
  }
};

// Function to get recent transactions
export const getRecentTransactions = async (limit: number = 3): Promise<any[]> => {
  try {
    // Get the current fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('getRecentTransactions: No fuel pump ID available, cannot fetch transactions');
      return [];
    }
    
    console.log(`getRecentTransactions: Fetching for fuel pump ${fuelPumpId}`);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('id, fuel_type, amount, created_at, quantity')
      .eq('fuel_pump_id', fuelPumpId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    if (!data) {
      console.log(`getRecentTransactions: No transactions found for fuel pump ${fuelPumpId}`);
      return [];
    }
    
    console.log(`getRecentTransactions: Found ${data.length} transactions for fuel pump ${fuelPumpId}`);
    return data;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};

// Function to get current fuel levels
export const getCurrentFuelLevels = async (): Promise<Record<string, number>> => {
  try {
    // Get the current fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('getCurrentFuelLevels: No fuel pump ID available, cannot fetch fuel levels');
      return {};
    }
    
    console.log(`getCurrentFuelLevels: Fetching for fuel pump ${fuelPumpId}`);
    
    const { data, error } = await supabase
      .from('fuel_settings')
      .select('fuel_type, current_level, tank_capacity')
      .eq('fuel_pump_id', fuelPumpId);
      
    if (error) throw error;
    
    const fuelLevels: Record<string, number> = {};
    
    if (data && data.length > 0) {
      console.log(`getCurrentFuelLevels: Found ${data.length} fuel types for fuel pump ${fuelPumpId}`);
      
      data.forEach(fuel => {
        if (fuel.current_level !== null && fuel.tank_capacity !== null && fuel.tank_capacity > 0) {
          const percentage = (fuel.current_level / fuel.tank_capacity) * 100;
          fuelLevels[fuel.fuel_type] = Math.min(Math.round(percentage), 100);
        } else {
          fuelLevels[fuel.fuel_type] = 0;
        }
      });
    } else {
      console.log(`getCurrentFuelLevels: No fuel settings found for fuel pump ${fuelPumpId}`);
    }
    
    return fuelLevels;
  } catch (error) {
    console.error('Error fetching fuel levels:', error);
    return {};
  }
};

// Function to get dashboard metrics
export const getDashboardMetrics = async (startDate: Date, endDate: Date): Promise<DashboardMetrics> => {
  try {
    // Get the current fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('getDashboardMetrics: No fuel pump ID available, cannot fetch metrics');
      return {
        totalSales: '₹0',
        customers: '0',
        fuelVolume: '0 L',
        growth: '0%'
      };
    }
    
    console.log(`getDashboardMetrics: Fetching for fuel pump ${fuelPumpId}`);
    
    // Get total sales amount
    const { data: salesData, error: salesError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('fuel_pump_id', fuelPumpId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'));
      
    if (salesError) throw salesError;
    
    // Get customer count
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('fuel_pump_id', fuelPumpId);
      
    if (customerError) throw customerError;
    
    // Get fuel volumes (from daily readings)
    const { data: fuelData, error: fuelError } = await supabase
      .from('daily_readings')
      .select('sales_per_tank_stock')
      .eq('fuel_pump_id', fuelPumpId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'));
      
    if (fuelError) throw fuelError;
    
    // Calculate total sales
    const totalSales = salesData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    
    // Calculate total fuel volume
    const totalFuelVolume = fuelData?.reduce((sum, item) => sum + (Number(item.sales_per_tank_stock) || 0), 0) || 0;
    
    // Get previous period data for growth calculation
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(endDate);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - daysDiff);
    
    const { data: prevSalesData, error: prevSalesError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('fuel_pump_id', fuelPumpId)
      .gte('date', format(previousPeriodStart, 'yyyy-MM-dd'))
      .lte('date', format(previousPeriodEnd, 'yyyy-MM-dd'));
      
    if (prevSalesError) throw prevSalesError;
    
    // Calculate previous period sales
    const prevTotalSales = prevSalesData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    
    // Calculate growth percentage
    let growthPercentage = 0;
    if (prevTotalSales > 0) {
      growthPercentage = ((totalSales - prevTotalSales) / prevTotalSales) * 100;
    }
    
    console.log(`getDashboardMetrics: Metrics for fuel pump ${fuelPumpId}:`, {
      totalSales,
      customerCount: customerData?.length || 0,
      fuelVolume: totalFuelVolume,
      growth: growthPercentage
    });
    
    return {
      totalSales: `₹${totalSales.toLocaleString()}`,
      customers: customerData?.length.toString() || '0',
      fuelVolume: `${Math.round(totalFuelVolume).toLocaleString()} L`,
      growth: `${growthPercentage > 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      totalSales: '₹0',
      customers: '0',
      fuelVolume: '0 L',
      growth: '0%'
    };
  }
};
