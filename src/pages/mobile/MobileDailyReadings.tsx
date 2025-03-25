
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TankReadingsForm from '@/components/daily-readings/TankReadingsForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { ReadingFormData } from '@/components/daily-readings/TankReadingsForm';
import { calculateValues } from '@/components/daily-readings/readingUtils';

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

      toast({
        title: "Reading saved",
        description: "The daily reading has been recorded successfully."
      });

      // Reset form after successful save
      setReadingFormData({
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
      setTankCount(1);
    } catch (error) {
      console.error("Error saving reading:", error);
      toast({
        title: "Error",
        description: "Failed to save reading. Please try again.",
        variant: "destructive"
      });
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
            >
              Save Reading
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDailyReadings;
