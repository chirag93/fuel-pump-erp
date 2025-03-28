
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from "@/integrations/utils";

interface Reading {
  pumpId: string;
  openingReading: number;
  closingReading: number;
}

export const calculateFuelUsage = async (readings: Reading[]): Promise<{ [key: string]: number }> => {
  const fuelUsage: { [key: string]: number } = {};
  const fuelPumpId = await getFuelPumpId();
  
  // Fetch fuel types from settings
  const query = supabase
    .from('fuel_settings')
    .select('fuel_type');
    
  // Apply fuel pump filter if available
  if (fuelPumpId) {
    query.eq('fuel_pump_id', fuelPumpId);
  }
    
  const { data: fuelTypesData, error: fuelTypesError } = await query;
    
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
  const pumpQuery = supabase
    .from('pump_settings')
    .select('pump_number, fuel_types');
    
  // Apply fuel pump filter if available
  if (fuelPumpId) {
    pumpQuery.eq('fuel_pump_id', fuelPumpId);
  }
    
  const { data: pumpData, error: pumpError } = await pumpQuery;
    
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
  const fuelPumpId = await getFuelPumpId();
  
  // Fetch fuel settings from database
  const query = supabase
    .from('fuel_settings')
    .select('fuel_type, tank_capacity, current_level, current_price');
    
  // Apply fuel pump filter if available
  if (fuelPumpId) {
    query.eq('fuel_pump_id', fuelPumpId);
  }
    
  const { data, error } = await query;
    
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
  
  // Update tank levels based on the latest daily readings
  await updateTankLevelsFromReadings(fuelLevels);
  
  return fuelLevels;
};

// New function to update tank levels based on daily readings
const updateTankLevelsFromReadings = async (fuelLevels: { [key: string]: { capacity: number, current: number, price: number } }) => {
  try {
    const fuelPumpId = await getFuelPumpId();
    
    // For each fuel type, get the latest daily reading
    for (const fuelType of Object.keys(fuelLevels)) {
      const query = supabase
        .from('daily_readings')
        .select('closing_stock, date, receipt_quantity, sales_per_tank_stock')
        .eq('fuel_type', fuelType)
        .order('date', { ascending: false })
        .limit(1);
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        query.eq('fuel_pump_id', fuelPumpId);
      }
        
      const { data, error } = await query;
        
      if (error) {
        console.error(`Error fetching latest readings for ${fuelType}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        const latestReading = data[0];
        
        // If we have a valid closing stock, use it as the current level
        if (latestReading.closing_stock !== null && latestReading.closing_stock !== undefined) {
          // Update the current level in the fuel_levels object
          fuelLevels[fuelType].current = latestReading.closing_stock;
          
          // Also update the database with this value
          const updateQuery = supabase
            .from('fuel_settings')
            .update({
              current_level: latestReading.closing_stock,
              updated_at: new Date().toISOString()
            })
            .eq('fuel_type', fuelType);
            
          // Apply fuel pump filter if available
          if (fuelPumpId) {
            updateQuery.eq('fuel_pump_id', fuelPumpId);
          }
            
          const { error: updateError } = await updateQuery;
            
          if (updateError) {
            console.error(`Error updating fuel settings for ${fuelType}:`, updateError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error updating tank levels from readings:", error);
  }
};
