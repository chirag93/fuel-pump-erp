import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import FuelTankDisplay from '@/components/fuel/FuelTankDisplay';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';

interface StockEntry {
  id: string;
  fuel_type: 'Petrol' | 'Diesel' | 'Premium Petrol' | 'Premium Diesel' | 'CNG';
  quantity: number;
  price_per_unit: number;
  date: string;
  updated_at: string;
}

const StockLevels = () => {
  const [stockData, setStockData] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newStock, setNewStock] = useState<Partial<StockEntry>>({
    fuel_type: 'Petrol',
    quantity: 0,
    price_per_unit: 0,
    date: new Date().toISOString().split('T')[0]
  });
  
  // Listen for tank unload events using Supabase real-time
  useEffect(() => {
    // Set up a real-time subscription for tank_unloads
    const channel = supabase
      .channel('tank-unloads-channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'tank_unloads' 
        }, 
        (payload) => {
          console.log('New tank unload detected:', payload);
          // Trigger a refresh when a new tank unload is detected
          setRefreshTrigger(prev => prev + 1);
          
          // Show a toast notification
          toast({
            title: "Fuel Delivery Detected",
            description: `${payload.new.quantity} liters of ${payload.new.fuel_type} received`,
          });
          
          // Refresh the stock data
          fetchStockData();
        })
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    fetchStockData();
  }, [refreshTrigger]);
  
  const fetchStockData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First, try to get data from fuel_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('fuel_settings')
        .select('*');
        
      if (settingsError) {
        console.error('Error fetching fuel settings:', settingsError);
      }
      
      // Then get latest inventory records
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .order('date', { ascending: false });
        
      if (inventoryError) {
        throw inventoryError;
      }
      
      if (inventoryData) {
        setStockData(inventoryData as StockEntry[]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleAddStock = async () => {
    try {
      if (!newStock.fuel_type || !newStock.quantity || !newStock.price_per_unit) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          fuel_type: newStock.fuel_type,
          quantity: newStock.quantity,
          price_per_unit: newStock.price_per_unit,
          date: newStock.date
        }])
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Also update the fuel_settings table
        const { data: settingsData, error: settingsError } = await supabase
          .from('fuel_settings')
          .select('id, current_level')
          .eq('fuel_type', newStock.fuel_type)
          .maybeSingle();
          
        if (!settingsError) {
          if (settingsData) {
            // Update existing record
            await supabase
              .from('fuel_settings')
              .update({
                current_level: newStock.quantity,
                current_price: newStock.price_per_unit,
                updated_at: new Date().toISOString()
              })
              .eq('id', settingsData.id);
          } else {
            // Create new record
            await supabase
              .from('fuel_settings')
              .insert({
                fuel_type: newStock.fuel_type,
                current_level: newStock.quantity,
                current_price: newStock.price_per_unit,
                tank_capacity: newStock.fuel_type === 'Petrol' ? 10000 : 12000,
                updated_at: new Date().toISOString()
              });
          }
        }
        
        setStockData([...data as StockEntry[], ...stockData]);
        setRefreshTrigger(prev => prev + 1);
        toast({
          title: "Success",
          description: "Stock entry added successfully"
        });
        setIsDialogOpen(false);
        setNewStock({
          fuel_type: 'Petrol',
          quantity: 0,
          price_per_unit: 0,
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error adding stock entry:', error);
      toast({
        title: "Error",
        description: "Failed to add stock entry. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Get the latest stock entries for each fuel type
  const getLatestStocks = () => {
    const latest: Record<string, StockEntry> = {};
    
    stockData.forEach(entry => {
      if (!latest[entry.fuel_type] || new Date(entry.date) > new Date(latest[entry.fuel_type].date)) {
        latest[entry.fuel_type] = entry;
      }
    });
    
    return Object.values(latest);
  };
  
  // Group stock entries by month for the chart
  const getMonthlyStockData = () => {
    const monthlyData: Record<string, Record<string, number>> = {};
    
    stockData.forEach(entry => {
      const month = new Date(entry.date).toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = {};
      }
      
      if (!monthlyData[month][entry.fuel_type]) {
        monthlyData[month][entry.fuel_type] = entry.quantity;
      } else {
        // If we already have an entry for this month and fuel type, use the latest one
        const existingDate = new Date(monthlyData[month].date || 0);
        const currentDate = new Date(entry.date);
        if (currentDate > existingDate) {
          monthlyData[month][entry.fuel_type] = entry.quantity;
          monthlyData[month].date = entry.date;
        }
      }
    });
    
    // Convert to array format for recharts
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => {
      // Sort by date (assuming month format is "MMM YYYY")
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });
  };

  // Get chart data for tank unloads
  const getTankUnloadData = async () => {
    try {
      const { data, error } = await supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Process the data for the chart
      // Group by month and fuel type
      const processedData: Record<string, Record<string, number>> = {};
      
      data.forEach(unload => {
        if (!isValid(parseISO(unload.date))) return;
        
        const month = format(parseISO(unload.date), 'MMM yyyy');
        
        if (!processedData[month]) {
          processedData[month] = {};
        }
        
        if (!processedData[month][unload.fuel_type]) {
          processedData[month][unload.fuel_type] = 0;
        }
        
        // Fix for the error: Ensure quantity is a number
        const quantity = typeof unload.quantity === 'string' 
          ? parseFloat(unload.quantity) 
          : Number(unload.quantity);
          
        if (!isNaN(quantity)) {
          processedData[month][unload.fuel_type] += quantity;
        }
      });
      
      // Convert to array format for recharts
      return Object.entries(processedData).map(([month, data]) => ({
        month,
        ...data
      })).sort((a, b) => {
        // Sort by date
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
      });
    } catch (error) {
      console.error('Error fetching tank unload data:', error);
      return [];
    }
  };
  
  // State for chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'stock' | 'inflow'>('stock');
  
  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (chartType === 'stock') {
        setChartData(getMonthlyStockData());
      } else {
        const inflowData = await getTankUnloadData();
        setChartData(inflowData);
      }
    };
    
    fetchChartData();
  }, [stockData, chartType, refreshTrigger]);
  
  const latestStocks = getLatestStocks();
  
  // Get unique fuel types for chart coloring
  const uniqueFuelTypes = Array.from(
    new Set(stockData.map(entry => entry.fuel_type))
  );
  
  // Chart colors based on fuel type
  const getColorForFuelType = (fuelType: string) => {
    if (fuelType.toLowerCase().includes('petrol')) {
      return '#f97316'; // orange-500
    } else if (fuelType.toLowerCase().includes('diesel')) {
      return '#2563eb'; // blue-600
    } else if (fuelType.toLowerCase().includes('premium')) {
      return '#f59e0b'; // amber-500
    } else if (fuelType.toLowerCase().includes('cng')) {
      return '#22c55e'; // green-500
    } else {
      return '#8b5cf6'; // violet-500
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Levels</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRefreshTrigger(prev => prev + 1)}>
            <Loader2 className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Stock Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Stock Entry</DialogTitle>
                <DialogDescription>
                  Record today's fuel stock levels.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <select 
                    id="fuel_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newStock.fuel_type}
                    onChange={e => setNewStock({...newStock, fuel_type: e.target.value as StockEntry['fuel_type']})}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Premium Petrol">Premium Petrol</option>
                    <option value="Premium Diesel">Premium Diesel</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity (Liters)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newStock.quantity?.toString()}
                    onChange={e => setNewStock({...newStock, quantity: parseFloat(e.target.value)})}
                    placeholder="Enter quantity in liters"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price Per Liter (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newStock.price_per_unit?.toString()}
                    onChange={e => setNewStock({...newStock, price_per_unit: parseFloat(e.target.value)})}
                    placeholder="Enter price per liter"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newStock.date}
                    onChange={e => setNewStock({...newStock, date: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStock}>Save Stock Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading stock data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {latestStocks.map((stock, index) => (
              <FuelTankDisplay 
                key={index}
                fuelType={stock.fuel_type} 
                capacity={stock.fuel_type === 'Petrol' ? 10000 : 12000}
                lastUpdated={new Date(stock.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                showTankIcon={true}
                refreshTrigger={refreshTrigger}
              />
            ))}
          </div>
          
          <Tabs defaultValue="history">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="history">Stock History</TabsTrigger>
              <TabsTrigger value="chart">Stock Trend</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Stock History</CardTitle>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>
                    Historical record of fuel stock entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stockData.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No stock entries found. Add a new stock entry to get started.
                      </div>
                    ) : (
                      stockData.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{entry.fuel_type}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{entry.quantity.toLocaleString()} L</p>
                            <p className="text-sm">₹{entry.price_per_unit.toFixed(2)}/L</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Stock Trends</CardTitle>
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription className="flex items-center justify-between">
                    <span>Visualization of stock levels over time</span>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant={chartType === 'stock' ? "default" : "outline"}
                        onClick={() => setChartType('stock')}
                      >
                        Stock Levels
                      </Button>
                      <Button 
                        size="sm" 
                        variant={chartType === 'inflow' ? "default" : "outline"}
                        onClick={() => setChartType('inflow')}
                      >
                        Fuel Inflow
                      </Button>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    {chartData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No data available for the selected chart type
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                            tick={{ fontSize: 12 }}
                            label={{ 
                              value: 'Liters', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value.toLocaleString()} liters`, '']}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Legend />
                          {uniqueFuelTypes.map((fuelType, index) => (
                            <Bar 
                              key={index}
                              dataKey={fuelType}
                              name={fuelType}
                              fill={getColorForFuelType(fuelType)}
                              radius={[4, 4, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default StockLevels;
