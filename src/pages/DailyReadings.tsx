import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, Plus, TrendingUp } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from '@/components/layout/DashboardLayout';

interface DailyReading {
  id: string;
  date: string;
  fuel_type: string;
  dip_reading: number;
  opening_stock: number;
  receipt_quantity: number;
  closing_stock: number;
  actual_meter_sales: number;
  sales_per_tank_stock: number;
  stock_variation: number;
  created_at?: string;
}

const calculateVariation = (reading: Partial<DailyReading>) => {
  const sales_per_tank_stock = (reading.opening_stock || 0) + (reading.receipt_quantity || 0) - (reading.closing_stock || 0);
  const stock_variation = (reading.actual_meter_sales || 0) - sales_per_tank_stock;
  return { sales_per_tank_stock, stock_variation };
};

const DailyReadings = () => {
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [newReadingDialogOpen, setNewReadingDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newReading, setNewReading] = useState<Partial<DailyReading>>({
    date: new Date().toISOString().split('T')[0],
    fuel_type: '',
    dip_reading: 0,
    opening_stock: 0,
    receipt_quantity: 0,
    closing_stock: 0,
    actual_meter_sales: 0
  });

  useEffect(() => {
    fetchReadings();
  }, []);

  const fetchReadings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_readings')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setReadings(data as DailyReading[]);
      }
    } catch (error) {
      console.error('Error fetching readings:', error);
      toast({
        title: "Error",
        description: "Failed to load readings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

const handleAddReading = async () => {
  try {
    if (!newReading.fuel_type || 
        newReading.dip_reading === undefined || 
        newReading.opening_stock === undefined || 
        newReading.receipt_quantity === undefined || 
        newReading.closing_stock === undefined || 
        newReading.actual_meter_sales === undefined ||
        !newReading.date) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const calculatedValues = calculateVariation(newReading);
    
    // Create a proper object with all required fields explicitly defined
    const readingData = {
      date: newReading.date,
      fuel_type: newReading.fuel_type,
      dip_reading: newReading.dip_reading,
      opening_stock: newReading.opening_stock,
      receipt_quantity: newReading.receipt_quantity,
      closing_stock: newReading.closing_stock,
      actual_meter_sales: newReading.actual_meter_sales,
      sales_per_tank_stock: calculatedValues.sales_per_tank_stock,
      stock_variation: calculatedValues.stock_variation
    };

    const { data, error } = await supabase
      .from('daily_readings')
      .insert([readingData]);
      
    if (error) throw error;
    
    fetchReadings();
    setNewReadingDialogOpen(false);
    setNewReading({
      date: new Date().toISOString().split('T')[0],
      fuel_type: '',
      dip_reading: 0,
      opening_stock: 0,
      receipt_quantity: 0,
      closing_stock: 0,
      actual_meter_sales: 0
    });
    
    toast({
      title: "Success",
      description: "Reading added successfully"
    });
  } catch (error) {
    console.error('Error adding reading:', error);
    toast({
      title: "Error",
      description: "Failed to add reading. Please try again.",
      variant: "destructive"
    });
  }
};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Daily Readings</h1>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Readings</CardTitle>
              <Button onClick={() => setNewReadingDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Reading
              </Button>
            </div>
            <CardDescription>
              Track daily fuel levels and sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading readings...
              </div>
            ) : readings.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No readings found. Add a new reading to start tracking.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Dip Reading</TableHead>
                    <TableHead>Opening Stock</TableHead>
                    <TableHead>Receipt Quantity</TableHead>
                    <TableHead>Closing Stock</TableHead>
                    <TableHead>Meter Sales</TableHead>
                    <TableHead>Stock Variation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{new Date(reading.date).toLocaleDateString()}</TableCell>
                      <TableCell>{reading.fuel_type}</TableCell>
                      <TableCell>{reading.dip_reading}</TableCell>
                      <TableCell>{reading.opening_stock}</TableCell>
                      <TableCell>{reading.receipt_quantity}</TableCell>
                      <TableCell>{reading.closing_stock}</TableCell>
                      <TableCell>{reading.actual_meter_sales}</TableCell>
                      <TableCell>{reading.stock_variation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={newReadingDialogOpen} onOpenChange={setNewReadingDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Add New Reading
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Daily Reading</DialogTitle>
              <DialogDescription>
                Enter the daily readings for each fuel type.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  id="date"
                  value={newReading.date}
                  onChange={(e) => setNewReading({...newReading, date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Select onValueChange={(value) => setNewReading({...newReading, fuel_type: value})}>
                  <SelectTrigger id="fuel_type">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dip_reading">Dip Reading</Label>
                  <Input
                    type="number"
                    id="dip_reading"
                    value={newReading.dip_reading?.toString()}
                    onChange={(e) => setNewReading({...newReading, dip_reading: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opening_stock">Opening Stock</Label>
                  <Input
                    type="number"
                    id="opening_stock"
                    value={newReading.opening_stock?.toString()}
                    onChange={(e) => setNewReading({...newReading, opening_stock: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="receipt_quantity">Receipt Quantity</Label>
                  <Input
                    type="number"
                    id="receipt_quantity"
                    value={newReading.receipt_quantity?.toString()}
                    onChange={(e) => setNewReading({...newReading, receipt_quantity: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="closing_stock">Closing Stock</Label>
                  <Input
                    type="number"
                    id="closing_stock"
                    value={newReading.closing_stock?.toString()}
                    onChange={(e) => setNewReading({...newReading, closing_stock: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="actual_meter_sales">Actual Meter Sales</Label>
                <Input
                  type="number"
                  id="actual_meter_sales"
                  value={newReading.actual_meter_sales?.toString()}
                  onChange={(e) => setNewReading({...newReading, actual_meter_sales: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setNewReadingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddReading}>Add Reading</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DailyReadings;
