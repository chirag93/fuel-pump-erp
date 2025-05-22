
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SelectedShiftData } from '@/types/shift';
import { FuelReading, FuelUsageByType } from '@/types/shift-hooks';
import { normalizeFuelType } from '@/utils/fuelCalculations';

export function useShiftReadings(shiftId: string) {
  const [readings, setReadings] = useState<FuelReading[]>([]);
  const [fuelSalesByType, setFuelSalesByType] = useState<FuelUsageByType>({});
  const [totalLiters, setTotalLiters] = useState(0);
  const [fuelRates, setFuelRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch readings data
  useEffect(() => {
    const fetchReadings = async () => {
      if (!shiftId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch readings for this shift
        const { data: readingsData, error: readingsError } = await supabase
          .from('readings')
          .select('*')
          .eq('shift_id', shiftId);
          
        if (readingsError) {
          throw readingsError;
        }
        
        if (!readingsData || readingsData.length === 0) {
          console.log('No readings found for this shift');
          setReadings([]);
          return;
        }
        
        console.log(`Found ${readingsData.length} readings for shift:`, readingsData);
        
        // Transform into fuel readings format
        const transformedReadings: FuelReading[] = readingsData.map(reading => ({
          fuel_type: reading.fuel_type || 'Unknown',
          opening_reading: reading.opening_reading || 0,
          closing_reading: reading.closing_reading || reading.opening_reading || 0
        }));
        
        setReadings(transformedReadings);
        
        // Calculate fuel usage by type
        calculateFuelUsage(transformedReadings);
        
        // Fetch fuel rates
        await fetchFuelRates();
      } catch (err) {
        console.error('Error loading shift readings:', err);
        setError('Failed to load readings data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReadings();
  }, [shiftId]);

  // Calculate fuel usage for readings
  const calculateFuelUsage = (readings: FuelReading[]) => {
    const usageByType: FuelUsageByType = {};
    let calculatedTotalLiters = 0;
    
    readings.forEach(reading => {
      const fuelType = normalizeFuelType(reading.fuel_type);
      const dispensed = Math.max(0, reading.closing_reading - reading.opening_reading);
      calculatedTotalLiters += dispensed;
      
      if (fuelType) {
        // IMPORTANT: Always ensure fuel type is a string when used as an object key
        const fuelTypeStr = String(fuelType);
        if (!usageByType[fuelTypeStr]) {
          usageByType[fuelTypeStr] = 0;
        }
        usageByType[fuelTypeStr] += dispensed;
      }
    });
    
    setFuelSalesByType(usageByType);
    setTotalLiters(calculatedTotalLiters);
  };

  // Fetch current fuel rates/prices
  const fetchFuelRates = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('fuel_type, current_price');
        
      if (error) throw error;
      
      const rates: Record<string, number> = {};
      
      if (data) {
        data.forEach(item => {
          if (item.fuel_type) {
            // IMPORTANT: Always ensure fuel type is a string when used as an object key
            rates[String(item.fuel_type)] = item.current_price || 0;
          }
        });
      }
      
      setFuelRates(rates);
    } catch (err) {
      console.error('Error fetching fuel rates:', err);
    }
  };

  // Handle reading change
  const handleReadingChange = (fuelType: string, value: number) => {
    setReadings(prevReadings => 
      prevReadings.map(reading =>
        reading.fuel_type === fuelType
          ? { ...reading, closing_reading: value }
          : reading
      )
    );
    
    // Recalculate fuel usage with updated reading
    const updatedReadings = readings.map(reading =>
      reading.fuel_type === fuelType
        ? { ...reading, closing_reading: value }
        : reading
    );
    
    calculateFuelUsage(updatedReadings);
  };

  return {
    readings,
    fuelSalesByType,
    totalLiters,
    fuelRates,
    isLoading,
    error,
    handleReadingChange
  };
}
