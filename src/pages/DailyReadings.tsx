import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Download, RefreshCw } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';
import { useAuth } from '@/contexts/AuthContext';

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

// Import the new components
import ReadingsTable from '@/components/daily-readings/ReadingsTable';
import ReadingFormDialog from '@/components/daily-readings/ReadingFormDialog';
import DeleteReadingDialog from '@/components/daily-readings/DeleteReadingDialog';
import { ReadingFormData } from '@/components/daily-readings/TankReadingsForm';
import { calculateValues, processReadingsData, exportReadingsAsCSV } from '@/components/daily-readings/readingUtils';

const DailyReadings = () => {
  const { fuelPumpId: contextFuelPumpId, isAuthenticated } = useAuth();
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
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastTriedFuelPumpId, setLastTriedFuelPumpId] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
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
    const initializeData = async () => {
      setIsInitializing(true);
      try {
        // Check if user is authenticated
        if (!isAuthenticated) {
          console.log('User is not authenticated. Please sign in to fetch data.');
          setIsLoading(false);
          setIsInitializing(false);
          toast({
            title: "Authentication required",
            description: "Please sign in to view and manage daily readings",
            variant: "destructive"
          });
          return;
        }
        
        // First try to get the fuel pump ID from the context (most reliable)
        let pumpId = contextFuelPumpId;
        console.log(`DailyReadings initialization - Context fuel pump ID: ${pumpId || 'none'}`);
        
        // If not available in context, try to get it from the utility function
        if (!pumpId) {
          pumpId = await getFuelPumpId();
          console.log(`DailyReadings initialization - Utility function fuel pump ID: ${pumpId || 'none'}`);
        }
        
        // Default to the specific ID if still not available
        if (!pumpId) {
          pumpId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
          console.log(`DailyReadings initialization - Using default ID: ${pumpId}`);
        }
        
        if (pumpId) {
          setFuelPumpId(pumpId);
          // Fetch data
          await fetchReadings(pumpId);
          await fetchFuelTypes(pumpId);
          toast({
            title: "Connected to fuel pump",
            description: `Successfully connected to fuel pump ID: ${pumpId}`
          });
        } else {
          console.warn("No fuel pump ID available");
          toast({
            title: "No fuel pump configured",
            description: "Could not find an existing fuel pump. Please contact administrator."
          });
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        toast({
          title: "Error connecting to fuel pump",
          description: "Failed to connect to the database",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };
    
    initializeData();
  }, [contextFuelPumpId, isAuthenticated, refreshCounter]);

  const fetchFuelTypes = async (pumpId: string | null = fuelPumpId) => {
    try {
      console.log(`DailyReadings - Fetching fuel types with fuel pump ID: ${pumpId || 'none'}`);
      
      let query = supabase
        .from('fuel_settings')
        .select('fuel_type');
        
      // Apply fuel pump filter if available
      if (pumpId) {
        console.log(`Filtering fuel types by fuel_pump_id: ${pumpId}`);
        query = query.eq('fuel_pump_id', pumpId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      console.log(`Retrieved ${data?.length || 0} fuel types`);
      
      if (data && data.length > 0) {
        const types = data.map(item => item.fuel_type);
        console.log('Fuel types:', types);
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
      setFuelTypes(['Petrol', 'Diesel']);
    }
  };

  const fetchReadings = async (pumpId: string | null = fuelPumpId) => {
    setIsLoading(true);
    
    // Store the last tried ID to avoid duplicate error messages
    if (pumpId) {
      setLastTriedFuelPumpId(pumpId);
    }
    
    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log('User is not authenticated. Please sign in to fetch data.');
        setIsLoading(false);
        return;
      }
      
      // If no pumpId provided, try to get it first
      if (!pumpId) {
        if (contextFuelPumpId) {
          pumpId = contextFuelPumpId;
          console.log(`Using fuel pump ID from context: ${pumpId}`);
        } else {
          pumpId = await getFuelPumpId();
          console.log(`Using fuel pump ID from utility function: ${pumpId || 'none'}`);
        }
        
        // If still no ID, use the specific one we're trying to match
        if (!pumpId) {
          pumpId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
          console.log(`No fuel pump ID available, using specific ID: ${pumpId}`);
        }
      }
      
      console.log(`DailyReadings - Fetching readings with fuel pump ID: ${pumpId || 'none'}`);
      
      // Try direct ID match first
      let query = supabase
        .from('daily_readings')
        .select('*')
        .eq('fuel_pump_id', pumpId)
        .order('date', { ascending: false });
        
      console.log(`SQL query filter: daily_readings.fuel_pump_id = '${pumpId}'`);
      
      const { data, error } = await query;
        
      if (error) {
        console.error('Error in first attempt:', error);
        throw error;
      }
      
      const readingsCount = data?.length || 0;
      console.log(`Retrieved ${readingsCount} daily readings for fuel pump ID: ${pumpId}`);
      
      if (data && data.length > 0) {
        // Group readings by date and fuel type to display them properly
        const processedData = processReadingsData(data);
        console.log('Processed readings data:', processedData);
        setReadings(processedData);
      } else {
        console.log(`No daily readings found for fuel pump ID: ${pumpId}`);
        
        // If no results, try with the specific ID we're looking for
        if (pumpId !== '2c762f9c-f89b-4084-9ebe-b6902fdf4311') {
          const specificId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
          console.log(`Trying with specific ID: ${specificId}`);
          
          const fallbackQuery = supabase
            .from('daily_readings')
            .select('*')
            .eq('fuel_pump_id', specificId)
            .order('date', { ascending: false });
            
          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          
          if (fallbackError) {
            console.error('Error in fallback attempt:', fallbackError);
          } else {
            const fallbackCount = fallbackData?.length || 0;
            console.log(`Retrieved ${fallbackCount} daily readings with fallback ID`);
            
            if (fallbackData && fallbackData.length > 0) {
              const processedFallbackData = processReadingsData(fallbackData);
              console.log('Processed fallback data:', processedFallbackData);
              setReadings(processedFallbackData);
              
              // Update the fuel pump ID to use going forward
              setFuelPumpId(specificId);
              
              toast({
                title: "Using alternate fuel pump",
                description: `Found ${fallbackCount} readings with ID: ${specificId.substring(0, 8)}...`
              });
              
              return;
            }
          }
        }
        
        // If still no results, try without any filter as last resort
        console.log('Trying without fuel pump ID filter as last resort');
        const unfilteredQuery = supabase
          .from('daily_readings')
          .select('*')
          .order('date', { ascending: false })
          .limit(50);
          
        const { data: unfilteredData, error: unfilteredError } = await unfilteredQuery;
        
        if (unfilteredError) {
          console.error('Error in unfiltered attempt:', unfilteredError);
        } else {
          const unfilteredCount = unfilteredData?.length || 0;
          console.log(`Retrieved ${unfilteredCount} daily readings without filter`);
          
          if (unfilteredData && unfilteredData.length > 0) {
            const processedUnfilteredData = processReadingsData(unfilteredData);
            setReadings(processedUnfilteredData);
            
            toast({
              title: "Showing all readings",
              description: `Found ${unfilteredCount} readings across all fuel pumps`
            });
            
            return;
          }
        }
        
        // If we get here, we really have no readings to show
        setReadings([]);
      }
    } catch (error) {
      console.error('Error fetching readings:', error);
      toast({
        title: "Error",
        description: "Failed to load readings from database.",
        variant: "destructive"
      });
      setReadings([]);
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

  const handleManualRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Daily Readings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManualRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="text-muted-foreground text-center">
                <p className="mb-2">You need to be logged in to view daily readings.</p>
                <p className="text-sm text-muted-foreground">Please sign in to access this feature.</p>
              </div>
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="text-muted-foreground text-center">
                <p className="mb-2">No readings found. Add a new reading to start tracking.</p>
                <p className="text-sm text-muted-foreground">
                  {fuelPumpId ? 
                    `Using fuel pump ID: ${fuelPumpId.substring(0, 8)}...` : 
                    isInitializing ? 
                      'Initializing fuel pump connection...' :
                      'No fuel pump ID available'}
                </p>
                {lastTriedFuelPumpId && lastTriedFuelPumpId === '2c762f9c-f89b-4084-9ebe-b6902fdf4311' && (
                  <p className="text-xs text-amber-500 mt-2">
                    Tried with specific ID 2c762f9c-f89b-4084-9ebe-b6902fdf4311 but found no records
                  </p>
                )}
              </div>
              <Button onClick={() => handleOpenDialog()} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add First Reading
              </Button>
              <Button onClick={handleManualRefresh} variant="secondary" className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
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
