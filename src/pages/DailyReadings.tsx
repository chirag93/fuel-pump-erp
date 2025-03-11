
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarClock, Droplet, Loader2, Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface DailyReading {
  id: string;
  date: string;
  fuel_type: string;
  dip_reading: number;
  opening_stock: number;
  receipt_quantity: number;
  closing_stock: number;
  sales_per_tank_stock: number | null;
  actual_meter_sales: number;
  stock_variation: number | null;
  created_at: string | null;
}

const DailyReadings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableFuels, setAvailableFuels] = useState<string[]>([]);
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
    fetchFuelTypes();
  }, []);

  const fetchReadings = async () => {
    setIsLoading(true);
    try {
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

  const fetchFuelTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('fuel_type');

      if (error) {
        throw error;
      }

      if (data) {
        setAvailableFuels(data.map(item => item.fuel_type));
        if (data.length > 0) {
          setNewReading(prev => ({ ...prev, fuel_type: data[0].fuel_type }));
        }
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error);
    }
  };

  const calculateVariation = (newReadingData: Partial<DailyReading>) => {
    const openingStock = newReadingData.opening_stock || 0;
    const receiptQuantity = newReadingData.receipt_quantity || 0;
    const closingStock = newReadingData.closing_stock || 0;
    const actualMeterSales = newReadingData.actual_meter_sales || 0;

    const salesPerTankStock = openingStock + receiptQuantity - closingStock;
    const stockVariation = salesPerTankStock - actualMeterSales;

    return {
      sales_per_tank_stock: salesPerTankStock,
      stock_variation: stockVariation
    };
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
      
      // Create a complete reading object with all required fields
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
        .insert([readingData])
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setReadings(prev => [data[0] as DailyReading, ...prev]);
        setDialogOpen(false);
        setNewReading({
          date: new Date().toISOString().split('T')[0],
          fuel_type: newReading.fuel_type,
          dip_reading: 0,
          opening_stock: 0,
          receipt_quantity: 0,
          closing_stock: 0,
          actual_meter_sales: 0
        });

        toast({
          title: "Success",
          description: "Daily reading added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding reading:', error);
      toast({
        title: "Error",
        description: "Failed to add reading. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading readings...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Daily Readings</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Reading
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Daily Reading</DialogTitle>
                <DialogDescription>
                  Record a new daily reading for fuel stock reconciliation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newReading.date}
                    onChange={(e) => setNewReading({...newReading, date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <Select 
                    value={newReading.fuel_type} 
                    onValueChange={(value) => setNewReading({...newReading, fuel_type: value})}
                  >
                    <SelectTrigger id="fuel_type">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFuels.map((fuel) => (
                        <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dip_reading">Dip Reading</Label>
                    <Input
                      id="dip_reading"
                      type="number"
                      value={newReading.dip_reading?.toString()}
                      onChange={(e) => setNewReading({...newReading, dip_reading: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="opening_stock">Opening Stock</Label>
                    <Input
                      id="opening_stock"
                      type="number"
                      value={newReading.opening_stock?.toString()}
                      onChange={(e) => setNewReading({...newReading, opening_stock: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="receipt_quantity">Receipt Quantity</Label>
                    <Input
                      id="receipt_quantity"
                      type="number"
                      value={newReading.receipt_quantity?.toString()}
                      onChange={(e) => setNewReading({...newReading, receipt_quantity: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="closing_stock">Closing Stock</Label>
                    <Input
                      id="closing_stock"
                      type="number"
                      value={newReading.closing_stock?.toString()}
                      onChange={(e) => setNewReading({...newReading, closing_stock: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actual_meter_sales">Actual Meter Sales</Label>
                  <Input
                    id="actual_meter_sales"
                    type="number"
                    value={newReading.actual_meter_sales?.toString()}
                    onChange={(e) => setNewReading({...newReading, actual_meter_sales: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddReading}>Add Reading</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Today's Readings</CardTitle>
              <CardDescription>Readings recorded today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {readings.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Total Readings</CardTitle>
              <CardDescription>All recorded readings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{readings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Fuel Types</CardTitle>
              <CardDescription>Available fuel types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{availableFuels.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daily Readings Log</CardTitle>
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {readings.length === 0 ? (
              <div className="py-8 text-center">
                <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No readings recorded yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setDialogOpen(true)}
                >
                  Add First Reading
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Dip Reading</TableHead>
                    <TableHead>Opening Stock</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Closing Stock</TableHead>
                    <TableHead>Sales (Tank)</TableHead>
                    <TableHead>Sales (Meter)</TableHead>
                    <TableHead>Variation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{reading.date}</TableCell>
                      <TableCell className="font-medium">{reading.fuel_type}</TableCell>
                      <TableCell>{reading.dip_reading.toLocaleString()}</TableCell>
                      <TableCell>{reading.opening_stock.toLocaleString()}</TableCell>
                      <TableCell>{reading.receipt_quantity.toLocaleString()}</TableCell>
                      <TableCell>{reading.closing_stock.toLocaleString()}</TableCell>
                      <TableCell>{reading.sales_per_tank_stock?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{reading.actual_meter_sales.toLocaleString()}</TableCell>
                      <TableCell className={`${reading.stock_variation && reading.stock_variation < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {reading.stock_variation?.toLocaleString() || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DailyReadings;
