import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Download } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';

// Import the new components
import ReadingsTable from '@/components/daily-readings/ReadingsTable';
import ReadingFormDialog from '@/components/daily-readings/ReadingFormDialog';
import DeleteReadingDialog from '@/components/daily-readings/DeleteReadingDialog';
import { ReadingFormData } from '@/components/daily-readings/TankReadingsForm';
import { calculateValues, processReadingsData, exportReadingsAsCSV } from '@/components/daily-readings/readingUtils';

interface TankReading {
  tank_number: number;
  dip_reading: number;
  net_stock: number;
}

interface DailyReading {
  id: string;
  date: string;
  fuel_type: string;
  dip_reading: number;
  net_stock: number;
  opening_stock: number;
  receipt_quantity: number | null;
  closing_stock: number;
  sales_per_tank_stock: number;
  actual_meter_sales: number;
  stock_variation: number;
  created_at?: string;
  tank_number: number;
  tanks?: TankReading[];
}

const DailyReadings = () => {
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [selectedReadingDate, setSelectedReadingDate] = useState<string | null>(null);
  const [selectedReadingFuelType, setSelectedReadingFuelType] = useState<string | null>(null);
  const [tankCount, setTankCount] = useState<number>(1);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  
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
    fetchFuelTypes();
  }, []);

  const fetchFuelTypes = async () => {
    try {
      const fuelPumpId = await getFuelPumpId();
      console.log(`DailyReadings - Fetching fuel types with fuel pump ID: ${fuelPumpId || 'none'}`);
      
      const query = supabase
        .from('fuel_settings')
        .select('fuel_type');
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        console.log(`Filtering fuel types by fuel_pump_id: ${fuelPumpId}`);
        query.eq('fuel_pump_id', fuelPumpId);
      } else {
        console.log('No fuel pump ID available, fetching all fuel types');
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      console.log(`Retrieved ${data?.length || 0} fuel types`);
      
      if (data && data.length > 0) {
        const types = data.map(item => item.fuel_type);
        setFuelTypes(types);
        // Set default fuel type if none is selected
        if (!readingFormData.fuel_type && types.length > 0) {
          setReadingFormData(prev => ({
            ...prev,
            fuel_type: types[0]
          }));
        }
      } else {
        console.log('No fuel types found, using defaults');
        setFuelTypes(['Petrol', 'Diesel']);
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error);
    }
  };

  const fetchReadings = async () => {
    setIsLoading(true);
    try {
      const fuelPumpId = await getFuelPumpId();
      console.log(`DailyReadings - Fetching readings with fuel pump ID: ${fuelPumpId || 'none'}`);
      
      const query = supabase
        .from('daily_readings')
        .select('*')
        .order('date', { ascending: false });
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        console.log(`Filtering readings by fuel_pump_id: ${fuelPumpId}`);
        query.eq('fuel_pump_id', fuelPumpId);
      } else {
        console.log('No fuel pump ID available, fetching all readings');
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      console.log(`Retrieved ${data?.length || 0} daily readings`);
      
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

  const fetchPreviousDayClosingStock = async (date: string, fuelType: string): Promise<number | null> => {
    try {
      const fuelPumpId = await getFuelPumpId();
      
      // Find the most recent reading before the selected date
      const query = supabase
        .from('daily_readings')
        .select('closing_stock, date')
        .eq('fuel_type', fuelType)
        .lt('date', date)
        .order('date', { ascending: false })
        .limit(1);
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        query.eq('fuel_pump_id', fuelPumpId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      if (data && data.length > 0 && data[0].closing_stock !== null) {
        return data[0].closing_stock;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching previous day closing stock:', error);
      return null;
    }
  };

  const handleOpenDialog = async (reading?: DailyReading) => {
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
      const newReadingDate = new Date().toISOString().split('T')[0];
      const defaultFuelType = fuelTypes.length > 0 ? fuelTypes[0] : '';
      
      // Initialize with empty values first
      setReadingFormData({
        date: newReadingDate,
        fuel_type: defaultFuelType,
        readings: { 1: { dip_reading: 0, net_stock: 0, tank_number: 1 } },
        receipt_quantity: 0,
        closing_stock: 0,
        actual_meter_sales: 0
      });
      
      // If we have a fuel type, fetch the previous day's closing stock
      if (defaultFuelType) {
        const prevClosingStock = await fetchPreviousDayClosingStock(newReadingDate, defaultFuelType);
        
        // If we found a previous closing stock, update the net stock
        if (prevClosingStock !== null) {
          setReadingFormData(prev => ({
            ...prev,
            readings: {
              1: { ...prev.readings[1], net_stock: prevClosingStock }
            }
          }));
        }
      }
      
      setTankCount(1);
      setIsEditing(false);
    }
    
    setDialogOpen(true);
  };

  const handleOpenDeleteDialog = (reading: DailyReading) => {
    setSelectedReadingId(reading.id);
    setSelectedReadingDate(reading.date);
    setSelectedReadingFuelType(reading.fuel_type);
    setDeleteDialogOpen(true);
  };

  const handleTankInputChange = (tankNumber: number, field: string, value: string) => {
    setReadingFormData(prev => ({
      ...prev,
      readings: {
        ...prev.readings,
        [tankNumber]: {
          ...prev.readings[tankNumber],
          [field]: value === '' ? '' : parseFloat(value) || 0
        }
      }
    }));
  };

  const handleInputChange = async (field: string, value: string) => {
    if (field === 'fuel_type' && !isEditing) {
      // When fuel type changes, fetch the previous day's closing stock
      const prevClosingStock = await fetchPreviousDayClosingStock(readingFormData.date, value);
      
      setReadingFormData(prev => {
        const updatedReadings = { ...prev.readings };
        
        // Update net stock for all tanks
        Object.keys(updatedReadings).forEach(tankKey => {
          const tankNumber = parseInt(tankKey);
          updatedReadings[tankNumber] = {
            ...updatedReadings[tankNumber],
            net_stock: prevClosingStock !== null ? prevClosingStock / Object.keys(updatedReadings).length : 0
          };
        });
        
        return {
          ...prev,
          [field]: value,
          readings: updatedReadings
        };
      });
    } else if (field === 'date' && !isEditing) {
      // When date changes, fetch the previous day's closing stock for the current fuel type
      const newDate = value;
      const prevClosingStock = await fetchPreviousDayClosingStock(newDate, readingFormData.fuel_type);
      
      setReadingFormData(prev => {
        const updatedReadings = { ...prev.readings };
        
        // Update net stock for all tanks
        Object.keys(updatedReadings).forEach(tankKey => {
          const tankNumber = parseInt(tankKey);
          updatedReadings[tankNumber] = {
            ...updatedReadings[tankNumber],
            net_stock: prevClosingStock !== null ? prevClosingStock / Object.keys(updatedReadings).length : 0
          };
        });
        
        return {
          ...prev,
          [field]: value,
          readings: updatedReadings
        };
      });
    } else {
      // For other fields, just update normally
      setReadingFormData(prev => ({
        ...prev,
        [field]: field === 'date' || field === 'fuel_type' ? value : (value === '' ? '' : parseFloat(value) || 0)
      }));
    }
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
      
      // Get fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      
      // Create entries for each tank
      const entries = Object.values(readingFormData.readings).map(tank => ({
        date: readingFormData.date,
        fuel_type: readingFormData.fuel_type,
        dip_reading: tank.dip_reading,
        net_stock: tank.net_stock,
        tank_number: tank.tank_number,
        opening_stock: calculations.opening_stock,
        receipt_quantity: readingFormData.receipt_quantity || null,
        closing_stock: readingFormData.closing_stock,
        actual_meter_sales: readingFormData.actual_meter_sales,
        sales_per_tank_stock: calculations.sales_per_tank_stock,
        stock_variation: calculations.stock_variation,
        fuel_pump_id: fuelPumpId
      }));
      
      // Insert entries
      const { error } = await supabase
        .from('daily_readings')
        .insert(entries);
        
      if (error) throw error;
      
      // Update fuel_settings with the new closing stock (tank level)
      const updateQuery = supabase
        .from('fuel_settings')
        .update({
          current_level: readingFormData.closing_stock,
          updated_at: new Date().toISOString()
        })
        .eq('fuel_type', readingFormData.fuel_type.trim());
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        updateQuery.eq('fuel_pump_id', fuelPumpId);
      }
      
      const { error: updateError } = await updateQuery;
        
      if (updateError) {
        console.error('Error updating fuel settings:', updateError);
        // Still show success for the reading, but log the error
        toast({
          title: "Warning",
          description: "Reading saved but failed to update tank level",
          variant: "destructive"
        });
      } else {
        console.log(`Updated tank level for ${readingFormData.fuel_type} to ${readingFormData.closing_stock}`);
      }
      
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
      if (!selectedReadingDate || !selectedReadingFuelType) return;
      
      const { error } = await supabase
        .from('daily_readings')
        .delete()
        .eq('date', selectedReadingDate)
        .eq('fuel_type', selectedReadingFuelType);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Reading deleted successfully"
      });
      
      fetchReadings();
      setDeleteDialogOpen(false);
      setSelectedReadingId(null);
      setSelectedReadingDate(null);
      setSelectedReadingFuelType(null);
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
        <div className="flex gap-2">
          {readings.length > 0 && (
            <Button variant="outline" onClick={() => exportReadingsAsCSV(readings)}>
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
            <ReadingsTable
              readings={readings}
              handleOpenDialog={handleOpenDialog}
              handleOpenDeleteDialog={handleOpenDeleteDialog}
            />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ReadingFormDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        isEditing={isEditing}
        readingFormData={readingFormData}
        tankCount={tankCount}
        fuelTypes={fuelTypes}
        calculatedValues={calculatedValues}
        handleInputChange={handleInputChange}
        handleTankInputChange={handleTankInputChange}
        addTank={addTank}
        removeTank={removeTank}
        handleSaveReading={handleSaveReading}
      />

      {/* Delete Dialog */}
      <DeleteReadingDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        selectedReadingDate={selectedReadingDate}
        selectedReadingFuelType={selectedReadingFuelType}
        handleDeleteReading={handleDeleteReading}
      />
    </div>
  );
};

export default DailyReadings;
