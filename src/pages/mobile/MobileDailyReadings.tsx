
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Droplets, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TankReadingsForm from '@/components/daily-readings/TankReadingsForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { ReadingFormData } from '@/components/daily-readings/TankReadingsForm';
import { calculateValues } from '@/components/daily-readings/readingUtils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MobileDailyReadings = () => {
  const { toast } = useToast();
  const [tankCount, setTankCount] = useState(1);
  const [readingFormData, setReadingFormData] = useState<ReadingFormData>({
    date: new Date().toISOString().split('T')[0],
    fuel_type: 'Petrol',
    readings: {
      1: {
        tank_number: 1,
        dip_reading: 0,
        net_stock: 0
      }
    },
    receipt_quantity: 0,
    closing_stock: 0,
    actual_meter_sales: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousReadingData, setPreviousReadingData] = useState<any>(null);
  const [fuelTypes, setFuelTypes] = useState<string[]>(['Petrol', 'Diesel', 'Premium']);

  // Fetch fuel types from settings
  useEffect(() => {
    const fetchFuelTypes = async () => {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('fuel_type');
        
      if (error) {
        console.error('Error fetching fuel types:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const types = data.map(item => item.fuel_type);
        setFuelTypes(types);
        // Set default fuel type
        setReadingFormData(prev => ({
          ...prev,
          fuel_type: types[0]
        }));
      }
    };
    
    fetchFuelTypes();
  }, []);

  // Fetch previous reading when fuel type changes
  useEffect(() => {
    const fetchPreviousReading = async () => {
      const { data, error } = await supabase
        .from('daily_readings')
        .select('*')
        .eq('fuel_type', readingFormData.fuel_type)
        .order('date', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error fetching previous reading:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setPreviousReadingData(data[0]);
        
        // Use previous closing stock as today's opening stock
        const calculatedValues = calculateValues({
          ...readingFormData,
          readings: {
            ...readingFormData.readings,
            1: {
              ...readingFormData.readings[1],
              net_stock: data[0].closing_stock
            }
          }
        });
        
        // Update form data with previous data
        setReadingFormData(prev => ({
          ...prev,
          readings: {
            ...prev.readings,
            1: {
              ...prev.readings[1],
              net_stock: data[0].closing_stock
            }
          }
        }));
      } else {
        setPreviousReadingData(null);
      }
    };
    
    if (readingFormData.fuel_type) {
      fetchPreviousReading();
    }
  }, [readingFormData.fuel_type]);

  // Calculate dependent values based on form data
  const calculatedValues = calculateValues(readingFormData);

  // Handler for form input changes
  const handleInputChange = (field: string, value: string) => {
    setReadingFormData({
      ...readingFormData,
      [field]: field === 'fuel_type' ? value : Number(value)
    });
  };

  // Handler for tank-specific input changes
  const handleTankInputChange = (tankNumber: number, field: string, value: string) => {
    const updatedReadings = { ...readingFormData.readings };
    updatedReadings[tankNumber] = {
      ...updatedReadings[tankNumber],
      [field]: Number(value)
    };
    
    setReadingFormData({
      ...readingFormData,
      readings: updatedReadings
    });
  };

  // Add a new tank
  const addTank = () => {
    const newTankNumber = tankCount + 1;
    setTankCount(newTankNumber);
    
    const updatedReadings = { ...readingFormData.readings };
    updatedReadings[newTankNumber] = {
      tank_number: newTankNumber,
      dip_reading: 0,
      net_stock: 0
    };
    
    setReadingFormData({
      ...readingFormData,
      readings: updatedReadings
    });
  };

  // Remove a tank
  const removeTank = (tankNumber: number) => {
    if (tankCount > 1) {
      const updatedReadings = { ...readingFormData.readings };
      delete updatedReadings[tankNumber];
      
      setReadingFormData({
        ...readingFormData,
        readings: updatedReadings
      });
      
      setTankCount(tankCount - 1);
    }
  };

  // Save reading to database
  const handleSaveReading = async () => {
    if (readingFormData.closing_stock === 0) {
      toast({
        title: "Validation Error",
        description: "Closing stock cannot be zero",
        variant: "destructive"
      });
      return;
    }
    
    if (readingFormData.actual_meter_sales === 0) {
      toast({
        title: "Validation Error", 
        description: "Actual meter sales cannot be zero",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tanksToInsert = Object.values(readingFormData.readings).map(tank => ({
        date: readingFormData.date,
        fuel_type: readingFormData.fuel_type,
        dip_reading: tank.dip_reading,
        net_stock: tank.net_stock,
        tank_number: tank.tank_number,
        opening_stock: calculatedValues.opening_stock,
        receipt_quantity: readingFormData.receipt_quantity,
        closing_stock: readingFormData.closing_stock,
        sales_per_tank_stock: calculatedValues.sales_per_tank_stock,
        actual_meter_sales: readingFormData.actual_meter_sales,
        stock_variation: calculatedValues.stock_variation
      }));

      const { error } = await supabase
        .from('daily_readings')
        .insert(tanksToInsert);

      if (error) throw error;

      // Update fuel settings with new stock level
      await supabase
        .from('fuel_settings')
        .update({
          current_level: readingFormData.closing_stock,
          updated_at: new Date().toISOString()
        })
        .eq('fuel_type', readingFormData.fuel_type);

      toast({
        title: "Reading saved",
        description: "The daily reading has been recorded successfully."
      });

      // Reset form after successful save
      setReadingFormData({
        date: new Date().toISOString().split('T')[0],
        fuel_type: readingFormData.fuel_type,
        readings: {
          1: {
            tank_number: 1,
            dip_reading: 0,
            net_stock: 0
          }
        },
        receipt_quantity: 0,
        closing_stock: 0,
        actual_meter_sales: 0
      });
      setTankCount(1);
      
      // Re-fetch the previous reading
      const { data } = await supabase
        .from('daily_readings')
        .select('*')
        .eq('fuel_type', readingFormData.fuel_type)
        .order('date', { ascending: false })
        .limit(1);
        
      if (data && data.length > 0) {
        setPreviousReadingData(data[0]);
      }
      
    } catch (error) {
      console.error("Error saving reading:", error);
      toast({
        title: "Error",
        description: "Failed to save reading. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center mb-4">
        <Link to="/mobile">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Daily Meter Readings</h1>
      </div>
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <Droplets className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Record Today's Readings</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Enter the current meter readings for each fuel pump to track daily sales.
          </p>
          
          <div className="mb-4">
            <label htmlFor="fuelType" className="text-sm font-medium mb-1 block">
              Fuel Type
            </label>
            <Select
              value={readingFormData.fuel_type}
              onValueChange={(value) => handleInputChange('fuel_type', value)}
            >
              <SelectTrigger id="fuelType">
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {previousReadingData && (
            <div className="mb-4 p-3 bg-primary/10 rounded-md">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 text-primary mr-1" />
                <span className="text-sm font-medium">Previous Reading ({new Date(previousReadingData.date).toLocaleDateString()})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Opening:</span>
                  <span className="ml-1">{previousReadingData.opening_stock.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Closing:</span>
                  <span className="ml-1">{previousReadingData.closing_stock.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          
          <TankReadingsForm 
            readingFormData={readingFormData}
            tankCount={tankCount}
            handleTankInputChange={handleTankInputChange}
            addTank={addTank}
            removeTank={removeTank}
            calculatedValues={calculatedValues}
          />
          
          <div className="grid grid-cols-1 gap-3 mt-4">
            <div>
              <label htmlFor="receipt_quantity" className="text-sm font-medium">
                Receipt Quantity
              </label>
              <input
                type="number"
                id="receipt_quantity"
                value={readingFormData.receipt_quantity || ""}
                onChange={(e) => handleInputChange('receipt_quantity', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter receipt quantity"
              />
            </div>
            
            <div>
              <label htmlFor="closing_stock" className="text-sm font-medium">
                Closing Stock
              </label>
              <input
                type="number"
                id="closing_stock"
                value={readingFormData.closing_stock || ""}
                onChange={(e) => handleInputChange('closing_stock', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter closing stock"
              />
            </div>
            
            <div>
              <label htmlFor="actual_meter_sales" className="text-sm font-medium">
                Actual Meter Sales
              </label>
              <input
                type="number"
                id="actual_meter_sales"
                value={readingFormData.actual_meter_sales || ""}
                onChange={(e) => handleInputChange('actual_meter_sales', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter actual meter sales"
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleSaveReading}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Reading'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDailyReadings;
