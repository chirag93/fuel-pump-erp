
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { 
  Gauge, 
  Save, 
  Plus, 
  Calculator, 
  Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DailyReading {
  id?: string;
  date: string;
  fuel_type: string;
  dip_reading: number;
  opening_stock: number;
  receipt_quantity: number;
  closing_stock: number;
  actual_sales: number;
  created_at?: string;
}

const DailyReadings = () => {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [newReading, setNewReading] = useState<DailyReading>({
    date: today,
    fuel_type: 'Petrol',
    dip_reading: 0,
    opening_stock: 0,
    receipt_quantity: 0,
    closing_stock: 0,
    actual_sales: 0
  });

  // Fetch all daily readings
  const { data: readings = [], isLoading } = useQuery({
    queryKey: ['daily-readings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('daily_readings')
          .select('*')
          .order('date', { ascending: false });
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching daily readings:', error);
        toast({
          title: "Error",
          description: "Failed to load daily readings",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Add new reading mutation
  const addReadingMutation = useMutation({
    mutationFn: async (readingData: DailyReading) => {
      const { data, error } = await supabase
        .from('daily_readings')
        .insert([readingData])
        .select();
        
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-readings'] });
      toast({
        title: "Success",
        description: "Daily reading recorded successfully"
      });
      
      // Reset form to default values
      setNewReading({
        date: today,
        fuel_type: 'Petrol',
        dip_reading: 0,
        opening_stock: 0,
        receipt_quantity: 0,
        closing_stock: 0,
        actual_sales: 0
      });
    },
    onError: (error) => {
      console.error('Error adding daily reading:', error);
      toast({
        title: "Error",
        description: "Failed to add daily reading. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Calculate sales as per tank stock
  const calculateTankSales = (opening: number, receipt: number, closing: number) => {
    return Math.max(0, opening + receipt - closing);
  };

  // Calculate stock variation
  const calculateStockVariation = (tankSales: number, actualSales: number) => {
    return actualSales - tankSales;
  };

  // Handle input change
  const handleInputChange = (field: string, value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    setNewReading(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  // Handle save reading
  const handleSaveReading = () => {
    if (!newReading.date || !newReading.fuel_type || newReading.dip_reading === null) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    addReadingMutation.mutate(newReading);
  };

  // Calculate tank sales for the new reading input form
  const tankSales = calculateTankSales(
    newReading.opening_stock,
    newReading.receipt_quantity,
    newReading.closing_stock
  );

  // Calculate stock variation for the new reading input form
  const stockVariation = calculateStockVariation(tankSales, newReading.actual_sales);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Daily Tank Readings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Record New Reading
          </CardTitle>
          <CardDescription>
            Enter today's tank readings and sales figures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reading-date">Date</Label>
                <Input
                  id="reading-date"
                  type="date"
                  value={newReading.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuel-type">Fuel Type</Label>
                <Select 
                  value={newReading.fuel_type}
                  onValueChange={(value) => handleInputChange('fuel_type', value)}
                >
                  <SelectTrigger id="fuel-type">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dip-reading">DIP Reading</Label>
                <Input
                  id="dip-reading"
                  type="number"
                  min="0"
                  value={newReading.dip_reading || ''}
                  onChange={(e) => handleInputChange('dip_reading', e.target.value)}
                  placeholder="Enter DIP reading"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="opening-stock">Net Stock / Opening Stock (Litres)</Label>
                <Input
                  id="opening-stock"
                  type="number"
                  min="0"
                  value={newReading.opening_stock || ''}
                  onChange={(e) => handleInputChange('opening_stock', e.target.value)}
                  placeholder="Enter opening stock"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-quantity">Receipt Quantity (Litres)</Label>
                <Input
                  id="receipt-quantity"
                  type="number"
                  min="0"
                  value={newReading.receipt_quantity || ''}
                  onChange={(e) => handleInputChange('receipt_quantity', e.target.value)}
                  placeholder="Enter receipt quantity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="closing-stock">Closing Stock (Litres)</Label>
                <Input
                  id="closing-stock"
                  type="number"
                  min="0"
                  value={newReading.closing_stock || ''}
                  onChange={(e) => handleInputChange('closing_stock', e.target.value)}
                  placeholder="Enter closing stock"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tank-sales">Sales as per Tank Stock (Litres)</Label>
                <div className="relative">
                  <Input
                    id="tank-sales"
                    type="number"
                    value={tankSales}
                    readOnly
                    className="bg-muted"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated as: Opening Stock + Receipt Quantity - Closing Stock
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="actual-sales">Actual Sales as per Meter (Litres)</Label>
                <Input
                  id="actual-sales"
                  type="number"
                  min="0"
                  value={newReading.actual_sales || ''}
                  onChange={(e) => handleInputChange('actual_sales', e.target.value)}
                  placeholder="Enter actual sales from meter"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock-variation">Stock Variation (Litres)</Label>
                <div className="relative">
                  <Input
                    id="stock-variation"
                    type="number"
                    value={stockVariation}
                    readOnly
                    className={`bg-muted ${stockVariation < 0 ? 'text-red-500' : stockVariation > 0 ? 'text-green-500' : ''}`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated as: Actual Sales - Sales as per Tank Stock
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveReading}>
              <Save className="mr-2 h-4 w-4" />
              Save Reading
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reading History</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardDescription>
            Previous tank readings and sales records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading readings...</p>
            </div>
          ) : readings.length > 0 ? (
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
                    <TableHead>Tank Sales</TableHead>
                    <TableHead>Actual Sales</TableHead>
                    <TableHead>Variation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading: DailyReading) => {
                    const tankSales = calculateTankSales(
                      reading.opening_stock,
                      reading.receipt_quantity,
                      reading.closing_stock
                    );
                    const variation = calculateStockVariation(tankSales, reading.actual_sales);
                    
                    return (
                      <TableRow key={reading.id}>
                        <TableCell>
                          {new Date(reading.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{reading.fuel_type}</TableCell>
                        <TableCell>{reading.dip_reading}</TableCell>
                        <TableCell>{reading.opening_stock} L</TableCell>
                        <TableCell>{reading.receipt_quantity} L</TableCell>
                        <TableCell>{reading.closing_stock} L</TableCell>
                        <TableCell>{tankSales} L</TableCell>
                        <TableCell>{reading.actual_sales} L</TableCell>
                        <TableCell className={variation < 0 ? 'text-red-500' : variation > 0 ? 'text-green-500' : ''}>
                          {variation} L
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No readings found. Add a new reading to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyReadings;
