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
  
  console.log(`Calculating fuel usage with fuel pump ID: ${fuelPumpId || 'none'}`);
  
  try {
    // Fetch fuel types from settings
    let query = supabase
      .from('fuel_settings')
      .select('fuel_type');
      
    // Apply fuel pump filter if available
    if (fuelPumpId) {
      console.log(`Filtering fuel settings by fuel_pump_id: ${fuelPumpId}`);
      query.eq('fuel_pump_id', fuelPumpId);
    } else {
      console.log('No fuel pump ID available, attempting to get first available fuel pump');
      
      // Try to get the first fuel pump as fallback
      const { data: firstPumpData } = await supabase
        .from('fuel_pumps')
        .select('id')
        .limit(1)
        .maybeSingle();
        
      if (firstPumpData?.id) {
        console.log(`Fallback: Using first fuel pump ID for fuel settings: ${firstPumpData.id}`);
        query.eq('fuel_pump_id', firstPumpData.id);
      } else {
        console.log('No fuel pumps found, fetching all fuel settings');
      }
    }
      
    const { data: fuelTypesData, error: fuelTypesError } = await query;
      
    if (fuelTypesError) {
      console.error("Error fetching fuel types:", fuelTypesError);
      return {};
    }
    
    console.log(`Retrieved ${fuelTypesData?.length || 0} fuel types`);
    
    // Initialize fuel usage for each fuel type to 0
    const fuelTypes = fuelTypesData?.map(f => f.fuel_type) || ['Petrol', 'Diesel'];
    fuelTypes.forEach(type => {
      fuelUsage[type] = 0;
    });
    
    // Fetch pump settings to map pump IDs to fuel types
    let pumpQuery = supabase
      .from('pump_settings')
      .select('pump_number, fuel_types');
      
    // Apply fuel pump filter if available
    let firstPumpData = null;
    
    if (fuelPumpId) {
      console.log(`Filtering pump settings by fuel_pump_id: ${fuelPumpId}`);
      pumpQuery.eq('fuel_pump_id', fuelPumpId);
    } else {
      console.log('No fuel pump ID available for pump settings, trying to get first fuel pump');
      
      // Try to get the first fuel pump as fallback
      const { data: firstPump } = await supabase
        .from('fuel_pumps')
        .select('id')
        .limit(1)
        .single();
        
      firstPumpData = firstPump;
      
      if (firstPump?.id) {
        console.log(`Fallback: Using first fuel pump ID for pump settings: ${firstPump.id}`);
        pumpQuery.eq('fuel_pump_id', firstPump.id);
      } else {
        console.log('No fuel pumps found, fetching all pump settings');
      }
    }
      
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
    
    // Fallback to default mapping if no pumps are configured
    if (Object.keys(pumpFuelTypeMap).length === 0) {
      console.log('No pump settings found, using default mapping');
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
  } catch (error) {
    console.error("Error in calculateFuelUsage:", error);
    return { 'Petrol': 0, 'Diesel': 0 };
  }
};

export const getFuelLevels = async (): Promise<{ [key: string]: { capacity: number, current: number, price: number } }> => {
  let fuelPumpId = await getFuelPumpId();
  
  console.log(`Getting fuel levels with fuel pump ID: ${fuelPumpId || 'none'}`);
  
  try {
    // If no fuelPumpId, attempt to get first fuel pump as fallback
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, attempting to get first available fuel pump');
      
      const { data: firstPumpData } = await supabase
        .from('fuel_pumps')
        .select('id')
        .limit(1)
        .maybeSingle();
        
      if (firstPumpData?.id) {
        console.log(`Fallback: Using first fuel pump ID for fuel levels: ${firstPumpData.id}`);
        fuelPumpId = firstPumpData.id;
      } else {
        console.log('No fuel pumps found in database');
      }
    }
  
    // Fetch fuel settings from database
    let query = supabase
      .from('fuel_settings')
      .select('fuel_type, tank_capacity, current_level, current_price');
      
    // Apply fuel pump filter if available
    if (fuelPumpId) {
      console.log(`Filtering fuel settings by fuel_pump_id: ${fuelPumpId}`);
      query.eq('fuel_pump_id', fuelPumpId);
    } else {
      console.log('No fuel pump ID available, fetching all fuel settings');
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
    
    console.log(`Retrieved ${data?.length || 0} fuel settings`);
    console.log('Fuel settings data:', data);
    
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
      console.log("No fuel settings found, checking inventory data...");
      
      // If no settings found, try to get data from inventory
      for (const fuelType of ['Petrol', 'Diesel']) {
        console.log(`Fetching data for ${fuelType}`);
        
        try {
          // Try to get settings first
          let settingsQuery = supabase
            .from('fuel_settings')
            .select('*')
            .eq('fuel_type', fuelType);
            
          if (fuelPumpId) {
            console.log(`Filtering fuel settings by fuel_pump_id: ${fuelPumpId} and fuel_type: ${fuelType}`);
            settingsQuery.eq('fuel_pump_id', fuelPumpId);
          }
          
          const { data: settingsData, error: settingsError } = await settingsQuery;
          
          if (settingsError) throw settingsError;
          
          if (settingsData && settingsData.length > 0) {
            console.log("Settings data found:", settingsData[0]);
            const settings = settingsData[0];
            
            fuelLevels[fuelType] = {
              capacity: settings.tank_capacity || 10000,
              current: settings.current_level || 0,
              price: settings.current_price || 0
            };
            continue;
          } else {
            console.log("No settings data found, falling back to inventory");
          }
          
          // Fall back to inventory if no settings
          let inventoryQuery = supabase
            .from('inventory')
            .select('*')
            .eq('fuel_type', fuelType)
            .order('date', { ascending: false })
            .limit(1);
            
          if (fuelPumpId) {
            console.log(`Filtering inventory by fuel_pump_id: ${fuelPumpId} and fuel_type: ${fuelType}`);
            inventoryQuery.eq('fuel_pump_id', fuelPumpId);
          }
          
          const { data: inventoryData, error: inventoryError } = await inventoryQuery;
          
          if (inventoryError) throw inventoryError;
          
          if (inventoryData && inventoryData.length > 0) {
            console.log("Inventory data found:", inventoryData[0]);
            const inventory = inventoryData[0];
            
            fuelLevels[fuelType] = {
              capacity: 10000, // Default capacity
              current: inventory.quantity || 0,
              price: inventory.price_per_unit || 0
            };
          } else {
            console.log(`No data found for ${fuelType}, using default values`);
            // Default values if no data found
            fuelLevels[fuelType] = {
              capacity: fuelType === 'Petrol' ? 20000 : 15000,
              current: fuelType === 'Petrol' ? 12450 : 7800,
              price: 0
            };
          }
        } catch (err) {
          console.error(`Error fetching ${fuelType} data:`, err);
          // Default values if error
          fuelLevels[fuelType] = {
            capacity: fuelType === 'Petrol' ? 20000 : 15000,
            current: fuelType === 'Petrol' ? 12450 : 7800,
            price: 0
          };
        }
      }
    }
    
    // Update tank levels based on the latest daily readings
    await updateTankLevelsFromReadings(fuelLevels, fuelPumpId);
    
    return fuelLevels;
  } catch (error) {
    console.error("Error in getFuelLevels:", error);
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
};

// New function to update tank levels based on daily readings
const updateTankLevelsFromReadings = async (
  fuelLevels: { [key: string]: { capacity: number, current: number, price: number } },
  fuelPumpId: string | null
) => {
  try {
    // For each fuel type, get the latest daily reading
    for (const fuelType of Object.keys(fuelLevels)) {
      let query = supabase
        .from('daily_readings')
        .select('closing_stock, date, receipt_quantity, sales_per_tank_stock')
        .eq('fuel_type', fuelType)
        .order('date', { ascending: false })
        .limit(1);
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        console.log(`Filtering daily readings by fuel_pump_id: ${fuelPumpId} and fuel_type: ${fuelType}`);
        query.eq('fuel_pump_id', fuelPumpId);
      } else {
        console.log(`No fuel pump ID for daily readings, fetching all for fuel_type: ${fuelType}`);
      }
        
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
            .eq('fuel_type', fuelType);
            
          // Apply fuel pump filter if available
          if (fuelPumpId) {
            updateQuery.eq('fuel_pump_id', fuelPumpId);
          }
            
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
