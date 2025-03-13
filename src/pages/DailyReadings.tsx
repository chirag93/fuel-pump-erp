import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Trash2, Download } from 'lucide-react';
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

interface TankReading {
  tank_number: number;
  dip_reading: number;
  net_stock: number;
}

interface DailyReading {
  id: string;
  date: string;
  fuel_type: string;
  dip_reading: number;  // A1, A2, etc.
  net_stock: number;    // B1, B2, etc.
  opening_stock: number; // C (calculated)
  receipt_quantity: number; // D
  closing_stock: number; // E
  sales_per_tank_stock: number; // S (calculated)
  actual_meter_sales: number; // L
  stock_variation: number; // M (calculated)
  created_at?: string;
  tank_number: number;
  tanks?: TankReading[]; // Added this property to fix build errors
}

interface ReadingFormData {
  id?: string;
  date: string;
  fuel_type: string;
  readings: {
    [key: number]: {
      dip_reading: number; // A
      net_stock: number;   // B
      tank_number: number;
    }
  };
  receipt_quantity: number; // D
  closing_stock: number;    // E
  actual_meter_sales: number; // L
}

// Calculate dependent values
const calculateValues = (data: ReadingFormData) => {
  // Calculate total opening stock (C) - sum of all net stocks
  const totalOpeningStock = Object.values(data.readings).reduce(
    (sum, tank) => sum + (tank.net_stock || 0), 
    0
  );
  
  // Calculate sales per tank stock (S=C+D-E)
  const salesPerTankStock = totalOpeningStock + (data.receipt_quantity || 0) - (data.closing_stock || 0);
  
  // Calculate stock variation (M=L-S)
  const stockVariation = (data.actual_meter_sales || 0) - salesPerTankStock;
  
  return {
    opening_stock: totalOpeningStock,
    sales_per_tank_stock: salesPerTankStock,
    stock_variation: stockVariation
  };
};

const DailyReadings = () => {
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [tankCount, setTankCount] = useState<number>(1);
  
  const [readingFormData, setReadingFormData] = useState<ReadingFormData>({
    date: new Date().toISOString().split('T')[0],
    fuel_type: '',
    readings: {
      1: { dip_reading: 0, net_stock: 0, tank_number: 1 }
    },
    receipt_quantity: 0,
    closing_stock: 0,
    actual_meter_sales: 0
  });
  
  // Derived calculations
  const calculatedValues = calculateValues(readingFormData);

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
        // Group readings by date and fuel type to display them properly
        const processedData = processReadingsData(data);
        setReadings(processedData);
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

  // Process data from DB to group by date and fuel type
  const processReadingsData = (data: any[]): DailyReading[] => {
    // Create a map to group readings by date and fuel type
    const groupedMap = new Map();
    
    data.forEach(item => {
      const key = `${item.date}-${item.fuel_type}`;
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: item.id,
          date: item.date,
          fuel_type: item.fuel_type,
          opening_stock: item.opening_stock,
          receipt_quantity: item.receipt_quantity,
          closing_stock: item.closing_stock,
          sales_per_tank_stock: item.sales_per_tank_stock,
          actual_meter_sales: item.actual_meter_sales,
          stock_variation: item.stock_variation,
          created_at: item.created_at,
          tank_number: item.tank_number,
          tanks: []
        });
      }
      
      // Add tank information
      groupedMap.get(key).tanks.push({
        tank_number: item.tank_number || 1,
        dip_reading: item.dip_reading,
        net_stock: item.net_stock || item.opening_stock
      });
    });
    
    // Convert map to array and sort tanks within each entry
    const result = Array.from(groupedMap.values()).map(group => {
      group.tanks.sort((a: any, b: any) => a.tank_number - b.tank_number);
      return group;
    });
    
    return result as unknown as DailyReading[];
  };

  const handleOpenDialog = (reading?: any) => {
    if (reading) {
      // Setup form for editing
      const tankReadings: {[key: number]: any} = {};
      
      if (reading.tanks) {
        reading.tanks.forEach((tank: any) => {
          tankReadings[tank.tank_number] = {
            dip_reading: tank.dip_reading,
            net_stock: tank.net_stock,
            tank_number: tank.tank_number
          };
        });
      } else {
        // For backward compatibility with old records
        tankReadings[1] = {
          dip_reading: reading.dip_reading || 0, 
          net_stock: reading.opening_stock || 0,
          tank_number: 1
        };
      }
      
      setReadingFormData({
        id: reading.id,
        date: reading.date,
        fuel_type: reading.fuel_type,
        readings: tankReadings,
        receipt_quantity: reading.receipt_quantity || 0,
        closing_stock: reading.closing_stock || 0,
        actual_meter_sales: reading.actual_meter_sales || 0
      });
      
      setTankCount(Object.keys(tankReadings).length);
      setIsEditing(true);
    } else {
      // Setup form for new reading
      setReadingFormData({
        date: new Date().toISOString().split('T')[0],
        fuel_type: '',
        readings: { 1: { dip_reading: 0, net_stock: 0, tank_number: 1 } },
        receipt_quantity: 0,
        closing_stock: 0,
        actual_meter_sales: 0
      });
      setTankCount(1);
      setIsEditing(false);
    }
    
    setDialogOpen(true);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setSelectedReadingId(id);
    setDeleteDialogOpen(true);
  };

  const handleTankInputChange = (tankNumber: number, field: string, value: string) => {
    setReadingFormData(prev => ({
      ...prev,
      readings: {
        ...prev.readings,
        [tankNumber]: {
          ...prev.readings[tankNumber],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setReadingFormData(prev => ({
      ...prev,
      [field]: field === 'date' || field === 'fuel_type' ? value : (parseFloat(value) || 0)
    }));
  };

  const addTank = () => {
    const newTankNumber = tankCount + 1;
    setReadingFormData(prev => ({
      ...prev,
      readings: {
        ...prev.readings,
        [newTankNumber]: { dip_reading: 0, net_stock: 0, tank_number: newTankNumber }
      }
    }));
    setTankCount(newTankNumber);
  };

  const removeTank = (tankNumber: number) => {
    if (tankCount <= 1) return;
    
    const newReadings = { ...readingFormData.readings };
    delete newReadings[tankNumber];
    
    // Renumber the tanks if removing from the middle
    const updatedReadings: {[key: number]: any} = {};
    let newIndex = 1;
    
    Object.values(newReadings)
      .sort((a, b) => a.tank_number - b.tank_number)
      .forEach(tank => {
        updatedReadings[newIndex] = { ...tank, tank_number: newIndex };
        newIndex++;
      });
    
    setReadingFormData(prev => ({
      ...prev,
      readings: updatedReadings
    }));
    
    setTankCount(tankCount - 1);
  };

  const handleSaveReading = async () => {
    try {
      if (!readingFormData.fuel_type || !readingFormData.date) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }

      // Calculate derived values
      const calculations = calculateValues(readingFormData);
      
      if (isEditing && readingFormData.id) {
        // Delete old entries first (we're replacing them)
        await supabase
          .from('daily_readings')
          .delete()
          .eq('id', readingFormData.id);
      }
      
      // Create entries for each tank
      const entries = Object.values(readingFormData.readings).map(tank => ({
        date: readingFormData.date,
        fuel_type: readingFormData.fuel_type,
        dip_reading: tank.dip_reading,
        net_stock: tank.net_stock,
        tank_number: tank.tank_number,
        opening_stock: calculations.opening_stock,
        receipt_quantity: readingFormData.receipt_quantity,
        closing_stock: readingFormData.closing_stock,
        actual_meter_sales: readingFormData.actual_meter_sales
        // We no longer send sales_per_tank_stock and stock_variation as they're computed columns
      }));
      
      // Insert entries
      const { error } = await supabase
        .from('daily_readings')
        .insert(entries);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: isEditing ? "Reading updated successfully" : "Reading added successfully"
      });
      
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

  const exportReadings = () => {
    // Define CSV headers
    const headers = [
      'Date', 
      'Fuel Type',
      'Tank Number',
      'Dip Reading (A)', 
      'Net Stock (B)',
      'Opening Stock (C)', 
      'Receipt Quantity (D)', 
      'Closing Stock (E)', 
      'Sales per Tank Stock (S)',
      'Actual Meter Sales (L)',
      'Stock Variation (M)'
    ];
    
    // Convert readings to CSV rows
    const rows: any[] = [];
    
    readings.forEach(reading => {
      if (reading.tanks) {
        reading.tanks.forEach((tank: any) => {
          rows.push([
            new Date(reading.date).toLocaleDateString(),
            reading.fuel_type,
            tank.tank_number,
            tank.dip_reading.toFixed(2),
            tank.net_stock.toFixed(2),
            reading.opening_stock.toFixed(2),
            reading.receipt_quantity.toFixed(2),
            reading.closing_stock.toFixed(2),
            reading.sales_per_tank_stock.toFixed(2),
            reading.actual_meter_sales.toFixed(2),
            reading.stock_variation.toFixed(2)
          ]);
        });
      } else {
        // For backward compatibility
        rows.push([
          new Date(reading.date).toLocaleDateString(),
          reading.fuel_type,
          1,
          reading.dip_reading.toFixed(2),
          reading.opening_stock.toFixed(2),
          reading.opening_stock.toFixed(2),
          reading.receipt_quantity.toFixed(2),
          reading.closing_stock.toFixed(2),
          reading.sales_per_tank_stock.toFixed(2),
          reading.actual_meter_sales.toFixed(2),
          reading.stock_variation.toFixed(2)
        ]);
      }
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_readings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Daily Readings</h1>
        <div className="flex gap-2">
          {readings.length > 0 && (
            <Button variant="outline" onClick={exportReadings}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reading
          </Button>
        </div>
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
                  <TableHead>Tanks</TableHead>
                  <TableHead>Opening Stock (C)</TableHead>
                  <TableHead>Receipt Quantity (D)</TableHead>
                  <TableHead>Closing Stock (E)</TableHead>
                  <TableHead>Sales per Tank (S)</TableHead>
                  <TableHead>Actual Meter Sales (L)</TableHead>
                  <TableHead>Stock Variation (M)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell>{new Date(reading.date).toLocaleDateString()}</TableCell>
                    <TableCell>{reading.fuel_type}</TableCell>
                    <TableCell>
                      {reading.tanks ? (
                        <div className="flex flex-col gap-1">
                          {reading.tanks.map((tank: any) => (
                            <div key={tank.tank_number} className="text-xs">
                              Tank {tank.tank_number}: 
                              A{tank.tank_number}={tank.dip_reading}, 
                              B{tank.tank_number}={tank.net_stock}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs">
                          Tank 1: A1={reading.dip_reading}, B1={reading.opening_stock}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{reading.opening_stock}</TableCell>
                    <TableCell>{reading.receipt_quantity}</TableCell>
                    <TableCell>{reading.closing_stock}</TableCell>
                    <TableCell>{reading.sales_per_tank_stock}</TableCell>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Reading' : 'Add New Daily Reading'}</DialogTitle>
            <DialogDescription>
              Enter the daily readings for each fuel type.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  id="date"
                  value={readingFormData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Select 
                  value={readingFormData.fuel_type} 
                  onValueChange={(value) => handleInputChange('fuel_type', value)}
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
            </div>
            
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Tank Readings</h3>
                <Button type="button" variant="outline" size="sm" onClick={addTank}>
                  Add Tank
                </Button>
              </div>
              
              {/* Tank readings */}
              {Object.keys(readingFormData.readings).map((tankKey) => {
                const tankNumber = parseInt(tankKey);
                const tank = readingFormData.readings[tankNumber];
                
                return (
                  <div key={tankNumber} className="grid grid-cols-12 gap-3 mb-3 items-end">
                    <div className="col-span-2">
                      <Label>Tank {tankNumber}</Label>
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor={`dip_reading_${tankNumber}`}>Dip Reading (A{tankNumber})</Label>
                      <Input
                        type="number"
                        id={`dip_reading_${tankNumber}`}
                        value={tank.dip_reading}
                        onChange={(e) => handleTankInputChange(tankNumber, 'dip_reading', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor={`net_stock_${tankNumber}`}>Net Stock (B{tankNumber})</Label>
                      <Input
                        type="number"
                        id={`net_stock_${tankNumber}`}
                        value={tank.net_stock}
                        onChange={(e) => handleTankInputChange(tankNumber, 'net_stock', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      {tankCount > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTank(tankNumber)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Total Opening Stock (C) =</span>
                  <span>{calculatedValues.opening_stock}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="receipt_quantity">Receipt Quantity (D)</Label>
                <Input
                  type="number"
                  id="receipt_quantity"
                  value={readingFormData.receipt_quantity}
                  onChange={(e) => handleInputChange('receipt_quantity', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closing_stock">Closing Stock (E)</Label>
                <Input
                  type="number"
                  id="closing_stock"
                  value={readingFormData.closing_stock}
                  onChange={(e) => handleInputChange('closing_stock', e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center">
                <span className="font-medium mr-2">Sales Per Tank Stock (S) =</span>
                <span>{calculatedValues.sales_per_tank_stock}</span>
                <span className="ml-2 text-sm text-muted-foreground">(C + D - E)</span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="actual_meter_sales">Actual Meter Sales (L)</Label>
              <Input
                type="number"
                id="actual_meter_sales"
                value={readingFormData.actual_meter_sales}
                onChange={(e) => handleInputChange('actual_meter_sales', e.target.value)}
              />
            </div>
            
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center">
                <span className="font-medium mr-2">Stock Variation (M) =</span>
                <span>{calculatedValues.stock_variation}</span>
                <span className="ml-2 text-sm text-muted-foreground">(L - S)</span>
              </div>
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
