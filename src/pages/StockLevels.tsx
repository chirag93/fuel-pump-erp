import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { DatePicker } from "@/components/ui/date-picker";
import { format, subMonths } from "date-fns";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, Filter } from 'lucide-react';
import ChartPlaceholder from '@/components/shared/ChartPlaceholder';
import { useIsMobile } from '@/hooks/use-mobile';
import { getFuelPumpId } from '@/integrations/utils';

interface TankUnloadData {
  id: string;
  date: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  vehicle_number: string;
  created_at: string;
}

interface DailyReadingData {
  id: string;
  date: string;
  fuel_type: string;
  dip_reading: number;
  opening_stock: number;
  receipt_quantity: number;
  closing_stock: number;
  sales_per_tank_stock: number;
  actual_meter_sales: number;
  stock_variation: number;
  created_at: string;
}

const StockLevels = () => {
  const isMobile = useIsMobile();
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [tankUnloadData, setTankUnloadData] = useState<TankUnloadData[]>([]);
  const [dailyReadingData, setDailyReadingData] = useState<DailyReadingData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [levelChartData, setLevelChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, view]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : '';
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : '';
      const fuelPumpId = await getFuelPumpId();

      // Fetch Tank Unload Data for both fuel types
      const tankUnloadQuery = supabase
        .from('tank_unloads')
        .select('*')
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        tankUnloadQuery.eq('fuel_pump_id', fuelPumpId);
      }

      const { data: tankUnload, error: tankUnloadError } = await tankUnloadQuery;

      if (tankUnloadError) {
        throw tankUnloadError;
      }

      setTankUnloadData(tankUnload || []);

      // Fetch Daily Reading Data for both fuel types
      const dailyReadingsQuery = supabase
        .from('daily_readings')
        .select('*')
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        dailyReadingsQuery.eq('fuel_pump_id', fuelPumpId);
      }

      const { data: dailyReadings, error: dailyReadingsError } = await dailyReadingsQuery;

      if (dailyReadingsError) {
        throw dailyReadingsError;
      }

      setDailyReadingData(dailyReadings || []);

      // Process the data for charts
      processChartData(tankUnload || [], dailyReadings || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = (unloadData: TankUnloadData[], readingData: DailyReadingData[]) => {
    if (view === 'daily') {
      processDailyChartData(unloadData, readingData);
    } else {
      processMonthlyChartData(unloadData, readingData);
    }
  };

  const processDailyChartData = (unloadData: TankUnloadData[], readingData: DailyReadingData[]) => {
    // Group data by date
    const dateMap = new Map<string, { petrol: number; diesel: number; petrolLevel: number; dieselLevel: number }>();
    
    // Get all unique dates from both datasets
    const allDates = new Set<string>();
    unloadData.forEach(item => allDates.add(item.date));
    readingData.forEach(item => allDates.add(item.date));
    
    // Initialize data structure for all dates
    allDates.forEach(date => {
      dateMap.set(date, { petrol: 0, diesel: 0, petrolLevel: 0, dieselLevel: 0 });
    });
    
    // Process tank unload data
    unloadData.forEach(item => {
      const dateEntry = dateMap.get(item.date);
      if (dateEntry) {
        if (item.fuel_type.toLowerCase().includes('petrol')) {
          dateEntry.petrol += item.quantity;
        } else if (item.fuel_type.toLowerCase().includes('diesel')) {
          dateEntry.diesel += item.quantity;
        }
        dateMap.set(item.date, dateEntry);
      }
    });
    
    // Process daily reading data for closing stock levels
    readingData.forEach(item => {
      const dateEntry = dateMap.get(item.date);
      if (dateEntry) {
        if (item.fuel_type.toLowerCase().includes('petrol')) {
          dateEntry.petrolLevel = item.closing_stock;
        } else if (item.fuel_type.toLowerCase().includes('diesel')) {
          dateEntry.dieselLevel = item.closing_stock;
        }
        dateMap.set(item.date, dateEntry);
      }
    });
    
    // Convert map to array for chart
    const chartData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        petrol: data.petrol,
        diesel: data.diesel
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    // Convert map to array for level chart
    const levelChartData = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        petrolLevel: data.petrolLevel,
        dieselLevel: data.dieselLevel
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setChartData(chartData);
    setLevelChartData(levelChartData);
  };

  const processMonthlyChartData = (unloadData: TankUnloadData[], readingData: DailyReadingData[]) => {
    // Group data by month
    const monthMap = new Map<string, { petrol: number; diesel: number; petrolLevel: number; dieselLevel: number }>();
    
    // Process tank unload data
    unloadData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthMap.get(monthKey) || { petrol: 0, diesel: 0, petrolLevel: 0, dieselLevel: 0 };
      
      if (item.fuel_type.toLowerCase().includes('petrol')) {
        existing.petrol += item.quantity;
      } else if (item.fuel_type.toLowerCase().includes('diesel')) {
        existing.diesel += item.quantity;
      }
      
      monthMap.set(monthKey, existing);
    });
    
    // Use the last reading of each month for stock levels
    const monthReadings = new Map<string, Map<string, DailyReadingData>>();
    
    readingData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthReadings.has(monthKey)) {
        monthReadings.set(monthKey, new Map());
      }
      
      const fuelMap = monthReadings.get(monthKey)!;
      const existingReading = fuelMap.get(item.fuel_type);
      
      // If no reading exists for this fuel type or the current one is newer, update it
      if (!existingReading || new Date(item.date) > new Date(existingReading.date)) {
        fuelMap.set(item.fuel_type, item);
      }
    });
    
    // Now use the latest reading for each month for the stock levels
    monthReadings.forEach((fuelMap, monthKey) => {
      const existing = monthMap.get(monthKey) || { petrol: 0, diesel: 0, petrolLevel: 0, dieselLevel: 0 };
      
      fuelMap.forEach((reading, fuelType) => {
        if (fuelType.toLowerCase().includes('petrol')) {
          existing.petrolLevel = reading.closing_stock;
        } else if (fuelType.toLowerCase().includes('diesel')) {
          existing.dieselLevel = reading.closing_stock;
        }
      });
      
      monthMap.set(monthKey, existing);
    });
    
    // Convert map to array for chart
    const chartData = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        date: month,
        petrol: data.petrol,
        diesel: data.diesel
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
      
    // Convert map to array for level chart
    const levelChartData = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        date: month,
        petrolLevel: data.petrolLevel,
        dieselLevel: data.dieselLevel
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    setChartData(chartData);
    setLevelChartData(levelChartData);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Stock Levels</h1>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Stock Analysis</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={view} onValueChange={(value: 'daily' | 'monthly') => setView(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium mb-2">Start Date</div>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">End Date</div>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading stock data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fuel Deliveries ({view})</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return view === 'daily' 
                            ? format(date, 'dd/MM') 
                            : format(date, 'MMM yy');
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString()} L`, '']}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return view === 'daily' 
                            ? format(date, 'dd MMM yyyy')
                            : format(date, 'MMMM yyyy');
                        }}
                      />
                      <Legend />
                      <Bar name="Petrol" dataKey="petrol" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar name="Diesel" dataKey="diesel" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartPlaceholder 
                    message="No delivery data available for the selected period" 
                    height={300}
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Closing Stock Levels ({view})</CardTitle>
              </CardHeader>
              <CardContent>
                {levelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={levelChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return view === 'daily' 
                            ? format(date, 'dd/MM') 
                            : format(date, 'MMM yy');
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString()} L`, '']}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return view === 'daily' 
                            ? format(date, 'dd MMM yyyy')
                            : format(date, 'MMMM yyyy');
                        }}
                      />
                      <Legend />
                      <Line 
                        name="Petrol" 
                        type="monotone" 
                        dataKey="petrolLevel" 
                        stroke="#f97316" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line 
                        name="Diesel" 
                        type="monotone" 
                        dataKey="dieselLevel" 
                        stroke="#2563eb" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartPlaceholder 
                    message="No stock level data available for the selected period" 
                    height={300}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Period</th>
                      <th className="text-right py-3 px-4 font-medium">Petrol Delivered</th>
                      <th className="text-right py-3 px-4 font-medium">Diesel Delivered</th>
                      <th className="text-right py-3 px-4 font-medium">Total Delivered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.length > 0 ? (
                      chartData.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">
                            {view === 'daily' 
                              ? format(new Date(item.date), 'dd MMM yyyy')
                              : format(new Date(item.date), 'MMMM yyyy')}
                          </td>
                          <td className="text-right py-3 px-4">
                            {item.petrol.toLocaleString()} L
                          </td>
                          <td className="text-right py-3 px-4">
                            {item.diesel.toLocaleString()} L
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {(item.petrol + item.diesel).toLocaleString()} L
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No data available for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {chartData.length > 0 && (
                    <tfoot>
                      <tr className="border-t bg-muted/20">
                        <td className="py-3 px-4 font-medium">Total</td>
                        <td className="text-right py-3 px-4 font-medium">
                          {chartData.reduce((sum, item) => sum + item.petrol, 0).toLocaleString()} L
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {chartData.reduce((sum, item) => sum + item.diesel, 0).toLocaleString()} L
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {chartData.reduce((sum, item) => sum + item.petrol + item.diesel, 0).toLocaleString()} L
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StockLevels;
