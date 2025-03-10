
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, FileText, Droplet, BarChart3, Plus, Calculator } from 'lucide-react';
import { supabase, DailyReading } from '@/integrations/supabase/client';

const DailyReadings = () => {
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fuelTypes, setFuelTypes] = useState<string[]>(['Petrol', 'Diesel']);
  
  const [newReading, setNewReading] = useState<Partial<DailyReading>>({
    date: new Date().toISOString().split('T')[0],
    fuel_type: 'Petrol',
    dip_reading: 0,
    opening_stock: 0,
    receipt_quantity: 0,
    closing_stock: 0,
    actual_meter_sales: 0
  });
  
  // Calculate sales per tank stock (derived)
  const salesPerTankStock = 
    (newReading.opening_stock || 0) + 
    (newReading.receipt_quantity || 0) - 
    (newReading.closing_stock || 0);
  
  // Calculate stock variation (derived)
  const stockVariation = 
    (newReading.actual_meter_sales || 0) - salesPerTankStock;
  
  // Fetch daily readings
  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('daily_readings')
          .select('*')
          .order('date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setReadings(data as DailyReading[]);
        }
        
        // Also get available fuel types from fuel_settings
        const { data: fuelSettingsData, error: fuelSettingsError } = await supabase
          .from('fuel_settings')
          .select('fuel_type');
          
        if (!fuelSettingsError && fuelSettingsData && fuelSettingsData.length > 0) {
          setFuelTypes(fuelSettingsData.map(item => item.fuel_type));
        }
      } catch (error) {
        console.error('Error fetching readings:', error);
        toast({
          title: "Error",
          description: "Failed to load daily readings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReadings();
  }, []);
  
  const handleAddReading = async () => {
    try {
      if (!newReading.date || !newReading.fuel_type || newReading.dip_reading === undefined || 
          newReading.opening_stock === undefined || newReading.receipt_quantity === undefined || 
          newReading.closing_stock === undefined || newReading.actual_meter_sales === undefined) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('daily_readings')
        .insert([{
          date: newReading.date,
          fuel_type: newReading.fuel_type,
          dip_reading: newReading.dip_reading,
          opening_stock: newReading.opening_stock,
          receipt_quantity: newReading.receipt_quantity,
          closing_stock: newReading.closing_stock,
          actual_meter_sales: newReading.actual_meter_sales
        }])
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setReadings([data[0] as DailyReading, ...readings]);
        toast({
          title: "Success",
          description: "Daily reading record added successfully"
        });
        setIsDialogOpen(false);
        setNewReading({
          date: new Date().toISOString().split('T')[0],
          fuel_type: 'Petrol',
          dip_reading: 0,
          opening_stock: 0,
          receipt_quantity: 0,
          closing_stock: 0,
          actual_meter_sales: 0
        });
      }
    } catch (error) {
      console.error('Error adding daily reading:', error);
      toast({
        title: "Error",
        description: "Failed to add daily reading record. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const getTodayReadings = () => {
    const today = new Date().toISOString().split('T')[0];
    return readings.filter(reading => reading.date === today);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Daily Readings</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Record New Reading
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Daily Reading</DialogTitle>
              <DialogDescription>
                Enter the daily fuel stock and sales readings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date*</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newReading.date}
                    onChange={(e) => setNewReading({...newReading, date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fuel_type">Fuel Type*</Label>
                  <Select 
                    value={newReading.fuel_type}
                    onValueChange={(value) => setNewReading({...newReading, fuel_type: value})}
                  >
                    <SelectTrigger id="fuel_type">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dip_reading">DIP Reading (cm)*</Label>
                <Input
                  id="dip_reading"
                  type="number"
                  step="0.1"
                  value={newReading.dip_reading?.toString()}
                  onChange={(e) => setNewReading({...newReading, dip_reading: parseFloat(e.target.value)})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="opening_stock">Opening Stock (Litres)*</Label>
                  <Input
                    id="opening_stock"
                    type="number"
                    step="0.1"
                    value={newReading.opening_stock?.toString()}
                    onChange={(e) => setNewReading({...newReading, opening_stock: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receipt_quantity">Receipt Quantity (Litres)*</Label>
                  <Input
                    id="receipt_quantity"
                    type="number"
                    step="0.1"
                    value={newReading.receipt_quantity?.toString()}
                    onChange={(e) => setNewReading({...newReading, receipt_quantity: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="closing_stock">Closing Stock (Litres)*</Label>
                  <Input
                    id="closing_stock"
                    type="number"
                    step="0.1"
                    value={newReading.closing_stock?.toString()}
                    onChange={(e) => setNewReading({...newReading, closing_stock: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actual_meter_sales">Actual Sales as per Meter (Litres)*</Label>
                  <Input
                    id="actual_meter_sales"
                    type="number"
                    step="0.1"
                    value={newReading.actual_meter_sales?.toString()}
                    onChange={(e) => setNewReading({...newReading, actual_meter_sales: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Calculator size={16} />
                    <span>Sales per Tank Stock</span>
                  </div>
                  <p className="text-xl font-bold mt-1">
                    {salesPerTankStock.toFixed(1)} L
                  </p>
                </div>
                <div className={`p-4 rounded-md ${Math.abs(stockVariation) > 10 ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <Calculator size={16} />
                    <span>Stock Variation</span>
                  </div>
                  <p className={`text-xl font-bold mt-1 ${Math.abs(stockVariation) > 10 ? 'text-destructive' : ''}`}>
                    {stockVariation.toFixed(1)} L
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddReading}>Save Reading</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading reading records...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Today's Readings</CardTitle>
                <CardDescription>Readings recorded today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{getTodayReadings().length}</div>
                <p className="text-sm text-muted-foreground">reading records</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Petrol Readings</CardTitle>
                <CardDescription>Total petrol reading records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {readings.filter(reading => reading.fuel_type === 'Petrol').length}
                </div>
                <p className="text-sm text-muted-foreground">reading records</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Diesel Readings</CardTitle>
                <CardDescription>Total diesel reading records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {readings.filter(reading => reading.fuel_type === 'Diesel').length}
                </div>
                <p className="text-sm text-muted-foreground">reading records</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daily Reading Records</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Fuel stock and sales reading records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {readings.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No reading records found. Add a new reading record to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>DIP Reading</TableHead>
                        <TableHead>Opening Stock</TableHead>
                        <TableHead>Receipt Qty</TableHead>
                        <TableHead>Closing Stock</TableHead>
                        <TableHead>Sales as per Tank</TableHead>
                        <TableHead>Actual Meter Sales</TableHead>
                        <TableHead>Variation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {readings.map((reading) => (
                        <TableRow key={reading.id}>
                          <TableCell>
                            {new Date(reading.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="font-medium">{reading.fuel_type}</TableCell>
                          <TableCell>{reading.dip_reading} cm</TableCell>
                          <TableCell>{reading.opening_stock.toLocaleString()} L</TableCell>
                          <TableCell>{reading.receipt_quantity.toLocaleString()} L</TableCell>
                          <TableCell>{reading.closing_stock.toLocaleString()} L</TableCell>
                          <TableCell>{reading.sales_per_tank_stock?.toLocaleString()} L</TableCell>
                          <TableCell>{reading.actual_meter_sales.toLocaleString()} L</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              reading.stock_variation && Math.abs(reading.stock_variation) < 5 
                                ? 'bg-green-100 text-green-800' 
                                : reading.stock_variation && Math.abs(reading.stock_variation) < 20 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {reading.stock_variation?.toFixed(1)} L
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DailyReadings;
