
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Fuel, Droplets, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FuelTankProps {
  fuelType: string;
  capacity?: number;
  lastUpdated?: string;
  showTankIcon?: boolean;
}

const FuelTankDisplay = ({ fuelType, capacity = 10000, lastUpdated, showTankIcon = false }: FuelTankProps) => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the current fuel level from the database
  useEffect(() => {
    const fetchFuelData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get data from fuel_settings first
        const { data: settingsData, error: settingsError } = await supabase
          .from('fuel_settings')
          .select('current_level, current_price, tank_capacity')
          .eq('fuel_type', fuelType)
          .maybeSingle();

        if (settingsData) {
          setCurrentLevel(Number(settingsData.current_level));
          setPricePerUnit(Number(settingsData.current_price));
          // If capacity is not provided as a prop, use from settings
          if (!capacity && settingsData.tank_capacity) {
            capacity = Number(settingsData.tank_capacity);
          }
        } else {
          // Fallback to inventory table
          const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('fuel_type', fuelType)
            .order('date', { ascending: false })
            .limit(1);
            
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            setCurrentLevel(Number(data[0].quantity));
            setPricePerUnit(Number(data[0].price_per_unit));
          } else {
            setError(`No data found for ${fuelType} tank`);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${fuelType} data:`, error);
        setError(`Failed to load ${fuelType} data`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFuelData();
  }, [fuelType, capacity]);
  
  const fillPercentage = Math.round((currentLevel / capacity) * 100);
  const isLow = fillPercentage < 20;
  
  // Define solid colors based on fuel type
  let color = '';
  let colorText = '';
  let colorBg = '';
  let fillColor = '';
  
  if (fuelType.toLowerCase().includes('petrol')) {
    // Solid orange/red for petrol
    color = 'bg-orange-500';
    colorText = 'text-orange-600';
    colorBg = 'bg-orange-100';
    fillColor = '#f97316'; // orange-500
  } else if (fuelType.toLowerCase().includes('diesel')) {
    // Solid blue for diesel
    color = 'bg-blue-600';
    colorText = 'text-blue-600';
    colorBg = 'bg-blue-100';
    fillColor = '#2563eb'; // blue-600
  } else if (fuelType.toLowerCase().includes('premium')) {
    // Premium gets a gold/yellow
    color = 'bg-amber-400';
    colorText = 'text-amber-600';
    colorBg = 'bg-amber-100';
    fillColor = '#f59e0b'; // amber-500
  } else {
    // Default to green
    color = 'bg-green-500';
    colorText = 'text-green-600';
    colorBg = 'bg-green-100';
    fillColor = '#22c55e'; // green-500
  }
  
  // Tank icon representation
  const renderTankIcon = () => {
    if (!showTankIcon) return null;

    // Create segments for the tank visualization
    const segments = 5;
    const filledSegments = Math.round((fillPercentage / 100) * segments);
    
    return (
      <div className="mt-4 w-24 h-32 border-2 border-gray-300 rounded-md mx-auto relative overflow-hidden">
        {/* Tank cap */}
        <div className="w-8 h-3 bg-gray-400 absolute -top-3 left-1/2 transform -translate-x-1/2 rounded-t-md"></div>
        
        {/* Tank level visualization with solid background */}
        <div 
          className={`absolute bottom-0 left-0 right-0 transition-all duration-500`} 
          style={{ 
            height: `${fillPercentage}%`,
            backgroundColor: fillColor
          }}
        ></div>
        
        {/* Fix text color with proper contrast */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-lg text-black bg-white/80 px-2 py-1 rounded-md shadow-sm">{fillPercentage}%</span>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color} text-white`}>
              {fuelType.toLowerCase().includes('diesel') ? <Droplets size={20} /> : <Fuel size={20} />}
            </div>
            <CardTitle>{fuelType} Tank</CardTitle>
          </div>
          <div className={`text-sm font-semibold rounded-full py-1 px-2 ${isLow ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {isLow ? 'Low' : 'Normal'}
          </div>
        </div>
        <CardDescription>
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'Current storage status'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Storage Level</span>
              <span className="font-bold">{fillPercentage}%</span>
            </div>
            <Progress value={fillPercentage} className={`h-3 ${color}`} />
            
            {/* Tank visualization */}
            {renderTankIcon()}
            
            <div className="grid grid-cols-2 gap-2 text-sm mt-4">
              <div>
                <span className="text-muted-foreground">Capacity</span>
                <p className="font-semibold">{capacity.toLocaleString()} liters</p>
              </div>
              <div>
                <span className="text-muted-foreground">Available</span>
                <p className="font-semibold">{currentLevel.toLocaleString()} liters</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-muted-foreground">Current Price</span>
              <p className="font-semibold">₹{pricePerUnit.toFixed(2)}/liter</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelTankDisplay;
