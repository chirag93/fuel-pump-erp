import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Fuel, Droplets, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';
import { toast } from '@/hooks/use-toast';
import { normalizeFuelType } from '@/utils/fuelCalculations';

interface FuelTankProps {
  fuelType: string;
  capacity?: number;
  lastUpdated?: string;
  showTankIcon?: boolean;
  refreshTrigger?: number;
}

const FuelTankDisplay = ({ fuelType, capacity, lastUpdated, showTankIcon = false, refreshTrigger = 0 }: FuelTankProps) => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tankCapacity, setTankCapacity] = useState<number>(capacity || 10000);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | undefined>(lastUpdated);
  
  // Normalize the fuel type to handle any trailing or leading whitespaces
  const normalizedFuelType = normalizeFuelType(fuelType);
  
  // Fetch the current fuel level from the database
  useEffect(() => {
    const fetchFuelData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current fuel pump ID
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available for fetching fuel data');
          setError('Authentication required');
          setIsLoading(false);
          return;
        }
        
        console.log(`Fetching data for ${normalizedFuelType} (fuel pump: ${fuelPumpId}), provided capacity: ${capacity}`);
        
        // Try to get data from fuel_settings first
        const { data: settingsData, error: settingsError } = await supabase
          .from('fuel_settings')
          .select('current_level, current_price, tank_capacity, updated_at')
          .eq('fuel_type', normalizedFuelType)
          .eq('fuel_pump_id', fuelPumpId)
          .maybeSingle();

        if (settingsData) {
          console.log('Settings data found:', settingsData);
          setCurrentLevel(Number(settingsData.current_level));
          setPricePerUnit(Number(settingsData.current_price));
          
          // Always prioritize settings tank capacity over prop capacity
          if (settingsData.tank_capacity) {
            console.log(`Using capacity from settings: ${settingsData.tank_capacity}`);
            setTankCapacity(Number(settingsData.tank_capacity));
          } else if (capacity) {
            console.log(`Using capacity from props: ${capacity}`);
            setTankCapacity(Number(capacity));
          }
          
          // Update last updated time if we have it from settings
          if (settingsData.updated_at) {
            setLastUpdatedTime(new Date(settingsData.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }));
          }
        } else {
          console.log('No settings data found, falling back to inventory');
          // Fallback to inventory table
          const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('fuel_type', normalizedFuelType)
            .eq('fuel_pump_id', fuelPumpId)
            .order('date', { ascending: false })
            .limit(1);
            
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log('Inventory data found:', data[0]);
            setCurrentLevel(Number(data[0].quantity));
            setPricePerUnit(Number(data[0].price_per_unit));
            
            // Keep using provided capacity or default if still needed
            if (capacity) {
              setTankCapacity(Number(capacity));
            }
            
            // Update last updated time from inventory if provided one isn't available
            if (!lastUpdated && data[0].updated_at) {
              setLastUpdatedTime(new Date(data[0].updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }));
            }
          } else {
            setError(`No data found for ${normalizedFuelType} tank`);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${normalizedFuelType} data:`, error);
        setError(`Failed to load ${normalizedFuelType} data`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFuelData();
  }, [normalizedFuelType, capacity, lastUpdated, refreshTrigger]);
  
  const fillPercentage = Math.round((currentLevel / tankCapacity) * 100);
  const isLow = fillPercentage < 20;
  
  // Define solid colors based on fuel type
  let color = '';
  let colorText = '';
  let colorBg = '';
  let fillColor = '';
  
  if (normalizedFuelType.toLowerCase().includes('petrol')) {
    // Solid orange/red for petrol
    color = 'bg-orange-500';
    colorText = 'text-orange-600';
    colorBg = 'bg-orange-100';
    fillColor = '#f97316'; // orange-500
  } else if (normalizedFuelType.toLowerCase().includes('diesel')) {
    // Solid blue for diesel
    color = 'bg-blue-600';
    colorText = 'text-blue-600';
    colorBg = 'bg-blue-100';
    fillColor = '#2563eb'; // blue-600
  } else if (normalizedFuelType.toLowerCase().includes('premium')) {
    // Premium gets a gold/yellow
    color = 'bg-amber-400';
    colorText = 'text-amber-600';
    colorBg = 'bg-amber-100';
    fillColor = '#f59e0b'; // amber-500
  } else if (normalizedFuelType.toLowerCase().includes('cng')) {
    // CNG gets a green
    color = 'bg-green-500';
    colorText = 'text-green-600';
    colorBg = 'bg-green-100';
    fillColor = '#22c55e'; // green-500
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
              {normalizedFuelType.toLowerCase().includes('diesel') ? <Droplets size={20} /> : <Fuel size={20} />}
            </div>
            <CardTitle>{normalizedFuelType} Tank</CardTitle>
          </div>
          <div className={`text-sm font-semibold rounded-full py-1 px-2 ${isLow ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {isLow ? 'Low' : 'Normal'}
          </div>
        </div>
        <CardDescription>
          {lastUpdatedTime ? `Last updated: ${lastUpdatedTime}` : 'Current storage status'}
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
            {renderTankIcon && renderTankIcon()}
            
            <div className="grid grid-cols-2 gap-2 text-sm mt-4">
              <div>
                <span className="text-muted-foreground">Capacity</span>
                <p className="font-semibold">{tankCapacity.toLocaleString()} liters</p>
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
