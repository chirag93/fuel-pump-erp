import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'recharts';
import { Calendar } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return lastMonth;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [tankUnloadData, setTankUnloadData] = useState<TankUnloadData[]>([]);
  const [dailyReadingData, setDailyReadingData] = useState<DailyReadingData[]>([]);
  const [tankUnloadChartData, setTankUnloadChartData] = useState<any[]>([]);
  const [dailyReadingChartData, setDailyReadingChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, fuelType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : '';
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : '';

      // Fetch Tank Unload Data
      const { data: tankUnload, error: tankUnloadError } = await supabase
        .from('tank_unloads')
        .select('*')
        .eq('fuel_type', fuelType)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);

      if (tankUnloadError) {
        throw tankUnloadError;
      }

      setTankUnloadData(tankUnload || []);
      setTankUnloadChartData(getTankUnloadData(tankUnload || [], fuelType));

      // Fetch Daily Reading Data
      const { data: dailyReadings, error: dailyReadingsError } = await supabase
        .from('daily_readings')
        .select('*')
        .eq('fuel_type', fuelType)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);

      if (dailyReadingsError) {
        throw dailyReadingsError;
      }

      setDailyReadingData(dailyReadings || []);
      setDailyReadingChartData(getDailyReadingData(dailyReadings || [], fuelType));
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

  const groupDataByMonth = (data: any[], fuelType: string) => {
    const groupedData: { [key: string]: { totalQuantity: number; totalAmount: number } } = {};

    data.forEach((item: any) => {
      const date = new Date(item.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groupedData[monthYear]) {
        groupedData[monthYear] = {
          totalQuantity: 0,
          totalAmount: 0,
        };
      }

      groupedData[monthYear].totalQuantity += item.quantity;
      groupedData[monthYear].totalAmount += item.amount;
    });

    return groupedData;
  };

  const getTankUnloadData = (unloadData: any[], fuelType: string) => {
    const chartData = [];
    const groupedData = groupDataByMonth(unloadData, fuelType);
      
    for (const [date, data] of Object.entries(groupedData)) {
      const chartPoint: { [key: string]: string | number } = {
        name: date,
      };
          
      const quantityValue = data.totalQuantity;
      // Convert string to number and handle possible NaN
      chartPoint[fuelType] = typeof quantityValue === 'string' 
        ? (parseFloat(quantityValue) || 0) // Convert string to number, default to 0 if NaN
        : (quantityValue || 0); // Use value or 0 if null/undefined
          
      chartData.push(chartPoint);
    }
      
    return chartData;
  };

  const getDailyReadingData = (readingData: any[], fuelType: string) => {
    const chartData = [];
    const groupedData = groupDataByMonth(readingData, fuelType);

    for (const [date, data] of Object.entries(groupedData)) {
      const chartPoint: { [key: string]: string | number } = {
        name: date,
      };

      chartPoint['sales'] = data.totalQuantity;
      chartData.push(chartPoint);
    }

    return chartData;
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                className="w-full"
              />
            </div>
            <div>
              <Label>End Date</Label>
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                className="w-full"
              />
            </div>
            <div>
              <Label>Fuel Type</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-4">Loading data...</div>
      ) : (
        <>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Tank Unload Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tankUnloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={fuelType} fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Daily Readings Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyReadingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StockLevels;
