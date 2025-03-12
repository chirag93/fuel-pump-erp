
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [readingData, setReadingData] = useState<Partial<DailyReading>>({
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

  const handleOpenDialog = (reading?: DailyReading) => {
    if (reading) {
      setReadingData({
        id: reading.id,
        date: reading.date,
        fuel_type: reading.fuel_type,
        dip_reading: reading.dip_reading,
        opening_stock: reading.opening_stock,
        receipt_quantity: reading.receipt_quantity,
        closing_stock: reading.closing_stock,
        actual_meter_sales: reading.actual_meter_sales
      });
      setIsEditing(true);
    } else {
      setReadingData({
        date: new Date().toISOString().split('T')[0],
        fuel_type: '',
        dip_reading: 0,
        opening_stock: 0,
        receipt_quantity: 0,
        closing_stock: 0,
        actual_meter_sales: 0
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setSelectedReadingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSaveReading = async () => {
    try {
      if (!readingData.fuel_type || 
          readingData.dip_reading === undefined || 
          readingData.opening_stock === undefined || 
          readingData.receipt_quantity === undefined || 
          readingData.closing_stock === undefined || 
          readingData.actual_meter_sales === undefined ||
          !readingData.date) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }

      const calculatedValues = calculateVariation(readingData);
      
      // Create a proper object with all required fields explicitly defined
      const readingFormData = {
        date: readingData.date,
        fuel_type: readingData.fuel_type,
        dip_reading: readingData.dip_reading,
        opening_stock: readingData.opening_stock,
        receipt_quantity: readingData.receipt_quantity,
        closing_stock: readingData.closing_stock,
        actual_meter_sales: readingData.actual_meter_sales,
        sales_per_tank_stock: calculatedValues.sales_per_tank_stock,
        stock_variation: calculatedValues.stock_variation
      };

      if (isEditing && readingData.id) {
        // Update existing reading
        const { error } = await supabase
          .from('daily_readings')
          .update(readingFormData)
          .eq('id', readingData.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Reading updated successfully"
        });
      } else {
        // Insert new reading
        const { error } = await supabase
          .from('daily_readings')
          .insert([readingFormData]);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Reading added successfully"
        });
      }
      
      fetchReadings();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving reading:', error);
      toast({
        title: "Error",
        description: "Failed to save reading. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReading = async () => {
    try {
      if (!selectedReadingId) return;
      
      const { error } = await supabase
        .from('daily_readings')
        .delete()
        .eq('id', selectedReadingId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Reading deleted successfully"
      });
      
      fetchReadings();
      setDeleteDialogOpen(false);
      setSelectedReadingId(null);
    } catch (error) {
      console.error('Error deleting reading:', error);
      toast({
        title: "Error",
        description: "Failed to delete reading. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Daily Readings</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reading
        </Button>
      </div>
      
      <Card>
        <CardHeader>
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
                  <TableHead>Actions</TableHead>
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
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(reading)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteDialog(reading.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Reading' : 'Add New Daily Reading'}</DialogTitle>
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
                value={readingData.date}
                onChange={(e) => setReadingData({...readingData, date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fuel_type">Fuel Type</Label>
              <Select 
                value={readingData.fuel_type} 
                onValueChange={(value) => setReadingData({...readingData, fuel_type: value})}
              >
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
                  value={readingData.dip_reading?.toString()}
                  onChange={(e) => setReadingData({...readingData, dip_reading: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="opening_stock">Opening Stock</Label>
                <Input
                  type="number"
                  id="opening_stock"
                  value={readingData.opening_stock?.toString()}
                  onChange={(e) => setReadingData({...readingData, opening_stock: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="receipt_quantity">Receipt Quantity</Label>
                <Input
                  type="number"
                  id="receipt_quantity"
                  value={readingData.receipt_quantity?.toString()}
                  onChange={(e) => setReadingData({...readingData, receipt_quantity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closing_stock">Closing Stock</Label>
                <Input
                  type="number"
                  id="closing_stock"
                  value={readingData.closing_stock?.toString()}
                  onChange={(e) => setReadingData({...readingData, closing_stock: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="actual_meter_sales">Actual Meter Sales</Label>
              <Input
                type="number"
                id="actual_meter_sales"
                value={readingData.actual_meter_sales?.toString()}
                onChange={(e) => setReadingData({...readingData, actual_meter_sales: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReading}>
              {isEditing ? 'Update' : 'Add'} Reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReading}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DailyReadings;
