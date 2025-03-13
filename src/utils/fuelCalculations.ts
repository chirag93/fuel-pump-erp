
import { supabase } from "@/integrations/supabase/client";

interface Reading {
  pumpId: string;
  openingReading: number;
  closingReading: number;
}

export const calculateFuelUsage = async (readings: Reading[]): Promise<{ [key: string]: number }> => {
  const fuelUsage: { [key: string]: number } = {};
  
  // Fetch fuel types from settings
  const { data: fuelTypesData, error: fuelTypesError } = await supabase
    .from('fuel_settings')
    .select('fuel_type');
    
  if (fuelTypesError) {
    console.error("Error fetching fuel types:", fuelTypesError);
    return {};
  }
  
  // Initialize fuel usage for each fuel type to 0
  const fuelTypes = fuelTypesData?.map(f => f.fuel_type) || ['Petrol', 'Diesel'];
  fuelTypes.forEach(type => {
    fuelUsage[type] = 0;
  });
  
  // Fetch pump settings to map pump IDs to fuel types
  const { data: pumpData, error: pumpError } = await supabase
    .from('pump_settings')
    .select('pump_number, fuel_types');
    
  if (pumpError) {
    console.error("Error fetching pump settings:", pumpError);
    return fuelUsage;
  }
  
  // Map pump IDs to fuel types
  const pumpFuelTypeMap: { [key: string]: string } = {};
  pumpData?.forEach(pump => {
    if (pump.fuel_types && pump.fuel_types.length > 0) {
      pumpFuelTypeMap[pump.pump_number] = pump.fuel_types[0]; // Using first fuel type for simplicity
    }
  });
  
  // Fallback to default mapping if no pumps are configured
  if (Object.keys(pumpFuelTypeMap).length === 0) {
    pumpFuelTypeMap['P001'] = 'Petrol';
    pumpFuelTypeMap['P002'] = 'Diesel';
    pumpFuelTypeMap['P003'] = 'Petrol';
  }
  
  // Calculate fuel usage for each reading
  readings.forEach(reading => {
    const fuelType = pumpFuelTypeMap[reading.pumpId];
    if (fuelType) {
      const usage = reading.closingReading - reading.openingReading;
      if (usage > 0) {
        fuelUsage[fuelType] += usage;
      }
    }
  });
  
  return fuelUsage;
};

export const getFuelLevels = async (): Promise<{ [key: string]: { capacity: number, current: number, price: number } }> => {
  // Fetch fuel settings from database
  const { data, error } = await supabase
    .from('fuel_settings')
    .select('fuel_type, tank_capacity, current_level, current_price');
    
  if (error) {
    console.error("Error fetching fuel levels:", error);
    // Return default values if there's an error
    return {
      'Petrol': {
        capacity: 20000,
        current: 12450,
        price: 0
      },
      'Diesel': {
        capacity: 15000,
        current: 7800,
        price: 0
      }
    };
  }
  
  // Convert data to the expected format
  const fuelLevels: { [key: string]: { capacity: number, current: number, price: number } } = {};
  
  if (data && data.length > 0) {
    data.forEach(item => {
      fuelLevels[item.fuel_type] = {
        capacity: item.tank_capacity || 0,
        current: item.current_level || 0,
        price: item.current_price || 0
      };
    });
  } else {
    // Default values if no data found
    fuelLevels['Petrol'] = {
      capacity: 20000,
      current: 12450,
      price: 0
    };
    fuelLevels['Diesel'] = {
      capacity: 15000,
      current: 7800,
      price: 0
    };
  }
  
  return fuelLevels;
};
