
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from "@/integrations/utils";
import { toast } from '@/hooks/use-toast';

interface Reading {
  pumpId: string;
  openingReading: number;
  closingReading: number;
}

export const calculateFuelUsage = async (readings: Reading[]): Promise<{ [key: string]: number }> => {
  const fuelUsage: { [key: string]: number } = {};
  const fuelPumpId = await getFuelPumpId();
  
  console.log(`Calculating fuel usage with fuel pump ID: ${fuelPumpId || 'none'}`);
  
  try {
    if (!fuelPumpId) {
      console.log('No fuel pump ID available for calculating fuel usage');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to calculate fuel usage",
        variant: "destructive"
      });
      return {};
    }
    
    // Fetch fuel types from settings
    let query = supabase
      .from('fuel_settings')
      .select('fuel_type')
      .eq('fuel_pump_id', fuelPumpId);
      
    const { data: fuelTypesData, error: fuelTypesError } = await query;
      
    if (fuelTypesError) {
      console.error("Error fetching fuel types:", fuelTypesError);
      return {};
    }
    
    console.log(`Retrieved ${fuelTypesData?.length || 0} fuel types`);
    
    // Initialize fuel usage for each fuel type to 0
    const fuelTypes = fuelTypesData?.map(f => f.fuel_type) || [];
    
    if (fuelTypes.length === 0) {
      console.log('No fuel types found for this fuel pump');
      return {};
    }
    
    fuelTypes.forEach(type => {
      fuelUsage[type] = 0;
    });
    
    // Fetch pump settings to map pump IDs to fuel types
    let pumpQuery = supabase
      .from('pump_settings')
      .select('pump_number, fuel_types')
      .eq('fuel_pump_id', fuelPumpId);
      
    const { data: pumpData, error: pumpError } = await pumpQuery;
      
    if (pumpError) {
      console.error("Error fetching pump settings:", pumpError);
      return fuelUsage;
    }
    
    console.log(`Retrieved ${pumpData?.length || 0} pump settings`);
    
    // Map pump IDs to fuel types
    const pumpFuelTypeMap: { [key: string]: string } = {};
    pumpData?.forEach(pump => {
      if (pump.fuel_types && pump.fuel_types.length > 0) {
        pumpFuelTypeMap[pump.pump_number] = pump.fuel_types[0]; // Using first fuel type for simplicity
      }
    });
    
    // If no pump settings found, return empty usage
    if (Object.keys(pumpFuelTypeMap).length === 0) {
      console.log('No pump settings found for this fuel pump');
      return fuelUsage;
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
  } catch (error) {
    console.error("Error in calculateFuelUsage:", error);
    return {};
  }
};

export const getFuelLevels = async (): Promise<{ [key: string]: { capacity: number, current: number, price: number } }> => {
  let fuelPumpId = await getFuelPumpId();
  
  console.log(`Getting fuel levels with fuel pump ID: ${fuelPumpId || 'none'}`);
  
  try {
    if (!fuelPumpId) {
      console.log('No fuel pump ID available for getting fuel levels');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view fuel levels",
        variant: "destructive"
      });
      return {};
    }
  
    // Fetch fuel settings from database
    let query = supabase
      .from('fuel_settings')
      .select('fuel_type, tank_capacity, current_level, current_price')
      .eq('fuel_pump_id', fuelPumpId);
      
    const { data, error } = await query;
      
    if (error) {
      console.error("Error fetching fuel levels:", error);
      return {};
    }
    
    console.log(`Retrieved ${data?.length || 0} fuel settings`);
    
    // If no data found, return empty object
    if (!data || data.length === 0) {
      console.log("No fuel settings found for this fuel pump");
      return {};
    }
    
    // Convert data to the expected format
    const fuelLevels: { [key: string]: { capacity: number, current: number, price: number } } = {};
    
    data.forEach(item => {
      fuelLevels[item.fuel_type] = {
        capacity: item.tank_capacity || 0,
        current: item.current_level || 0,
        price: item.current_price || 0
      };
    });
    
    // Update tank levels based on the latest daily readings
    await updateTankLevelsFromReadings(fuelLevels, fuelPumpId);
    
    return fuelLevels;
  } catch (error) {
    console.error("Error in getFuelLevels:", error);
    return {};
  }
};

// Function to update tank levels based on daily readings
const updateTankLevelsFromReadings = async (
  fuelLevels: { [key: string]: { capacity: number, current: number, price: number } },
  fuelPumpId: string
) => {
  try {
    // For each fuel type, get the latest daily reading
    for (const fuelType of Object.keys(fuelLevels)) {
      let query = supabase
        .from('daily_readings')
        .select('closing_stock, date, receipt_quantity, sales_per_tank_stock')
        .eq('fuel_type', fuelType)
        .eq('fuel_pump_id', fuelPumpId)
        .order('date', { ascending: false })
        .limit(1);
        
      const { data, error } = await query;
        
      if (error) {
        console.error(`Error fetching latest readings for ${fuelType}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        const latestReading = data[0];
        console.log(`Found latest reading for ${fuelType} from ${latestReading.date} with closing stock: ${latestReading.closing_stock}`);
        
        // If we have a valid closing stock, use it as the current level
        if (latestReading.closing_stock !== null && latestReading.closing_stock !== undefined) {
          // Update the current level in the fuel_levels object
          fuelLevels[fuelType].current = latestReading.closing_stock;
          
          // Also update the database with this value
          let updateQuery = supabase
            .from('fuel_settings')
            .update({
              current_level: latestReading.closing_stock,
              updated_at: new Date().toISOString()
            })
            .eq('fuel_type', fuelType)
            .eq('fuel_pump_id', fuelPumpId);
            
          const { error: updateError } = await updateQuery;
            
          if (updateError) {
            console.error(`Error updating fuel settings for ${fuelType}:`, updateError);
          } else {
            console.log(`Updated fuel settings for ${fuelType} with current level: ${latestReading.closing_stock}`);
          }
        }
      } else {
        console.log(`No daily readings found for ${fuelType}`);
      }
    }
  } catch (error) {
    console.error("Error updating tank levels from readings:", error);
  }
};
