
interface Reading {
  pumpId: string;
  openingReading: number;
  closingReading: number;
}

export const calculateFuelUsage = (readings: Reading[], pumpIds: string[]): { [key: string]: number } => {
  const fuelUsage: { [key: string]: number } = {};
  
  // Initialize fuel usage for each fuel type to 0
  const fuelTypes = ['Petrol', 'Diesel'];
  fuelTypes.forEach(type => {
    fuelUsage[type] = 0;
  });
  
  // Map pump IDs to fuel types
  const pumpFuelTypeMap: { [key: string]: string } = {
    'P001': 'Petrol',
    'P002': 'Diesel',
    'P003': 'Petrol', // Premium Petrol, but we'll count it as regular Petrol for simplicity
  };
  
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

export const getFuelLevels = (): { [key: string]: { capacity: number, current: number } } => {
  // This would normally come from an API or database
  // For now, we'll provide static data
  return {
    'Petrol': {
      capacity: 20000,
      current: 12450,
    },
    'Diesel': {
      capacity: 15000,
      current: 7800,
    }
  };
};
