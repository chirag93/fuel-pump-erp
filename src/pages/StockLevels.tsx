
import { useState, useEffect } from 'react';
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

interface StockEntry {
  id: string;
  fuel_type: 'Petrol' | 'Diesel';
  quantity: number;
  price_per_unit: number;
  date: string;
  updated_at: string;
}

const StockLevels = () => {
  const [stockData, setStockData] = useState<StockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStock, setNewStock] = useState<Partial<StockEntry>>({
    fuel_type: 'Petrol',
    quantity: 0,
    price_per_unit: 0,
    date: new Date().toISOString().split('T')[0]
  });
  
  useEffect(() => {
    fetchStockData();
  }, []);
  
  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setStockData(data as StockEntry[]);
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
  };
  
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
        setStockData([...data as StockEntry[], ...stockData]);
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
      }
    });
    
    return monthlyData;
  };
  
  const latestStocks = getLatestStocks();
  const monthlyData = getMonthlyStockData();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Levels</h1>
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
                  onChange={e => setNewStock({...newStock, fuel_type: e.target.value as 'Petrol' | 'Diesel'})}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
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
                  <CardDescription>
                    Visualization of stock levels over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Historical stock chart visualization</p>
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
