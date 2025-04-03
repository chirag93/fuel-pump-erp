import { ReadingFormData } from './TankReadingsForm';

// Calculate dependent values
export const calculateValues = (data: ReadingFormData) => {
  // Calculate total opening stock (C) - sum of all net stocks
  const totalOpeningStock = Object.values(data.readings).reduce(
    (sum, tank) => sum + (typeof tank.net_stock === 'number' ? tank.net_stock : 0), 
    0
  );
  
  // Calculate sales per tank stock (S=C+D-E)
  const salesPerTankStock = totalOpeningStock + 
    (typeof data.receipt_quantity === 'number' ? data.receipt_quantity : 0) - 
    (typeof data.closing_stock === 'number' ? data.closing_stock : 0);
  
  // Calculate stock variation (M=L-S)
  const stockVariation = 
    (typeof data.actual_meter_sales === 'number' ? data.actual_meter_sales : 0) - 
    salesPerTankStock;
  
  return {
    opening_stock: totalOpeningStock,
    sales_per_tank_stock: salesPerTankStock,
    stock_variation: stockVariation
  };
};

// Process data from DB to group by date and fuel type
export const processReadingsData = (data: any[]) => {
  // Create a map to group readings by date and fuel type
  const groupedMap = new Map();
  
  data.forEach(item => {
    const key = `${item.date}-${item.fuel_type}`;
    
    if (!groupedMap.has(key)) {
      // Calculate sales_per_tank_stock and stock_variation if they're null
      const openingStock = item.opening_stock || 0;
      const receiptQuantity = item.receipt_quantity || 0;
      const closingStock = item.closing_stock || 0;
      const actualMeterSales = item.actual_meter_sales || 0;
      
      // Use the value from DB if available, otherwise calculate it
      // Note: since sales_per_tank_stock is a generated column, it should always be available from the DB
      const salesPerTankStock = item.sales_per_tank_stock !== null ? 
        item.sales_per_tank_stock : 
        (openingStock + receiptQuantity - closingStock);
      
      const stockVariation = item.stock_variation !== null ? 
        item.stock_variation : 
        (actualMeterSales - salesPerTankStock);
      
      groupedMap.set(key, {
        id: item.id,
        date: item.date,
        fuel_type: item.fuel_type,
        opening_stock: openingStock,
        receipt_quantity: receiptQuantity,
        closing_stock: closingStock,
        sales_per_tank_stock: salesPerTankStock, // For display only
        actual_meter_sales: actualMeterSales,
        stock_variation: stockVariation,
        created_at: item.created_at,
        tank_number: item.tank_number,
        tanks: []
      });
    }
    
    // Check if this tank already exists in the array (avoid duplicates)
    const existingEntry = groupedMap.get(key);
    const tankExists = existingEntry.tanks.some((tank: any) => tank.tank_number === item.tank_number);
    
    // Only add tank information if it doesn't already exist
    if (!tankExists) {
      existingEntry.tanks.push({
        tank_number: item.tank_number || 1,
        dip_reading: item.dip_reading,
        net_stock: item.net_stock || item.opening_stock
      });
    }
  });
  
  // Convert map to array and sort tanks within each entry
  const result = Array.from(groupedMap.values()).map(group => {
    group.tanks.sort((a: any, b: any) => a.tank_number - b.tank_number);
    return group;
  });
  
  return result;
};

// Prepare data for CSV export
export const prepareExportData = (readings: any[]) => {
  // Define CSV headers
  const headers = [
    'Date', 
    'Fuel Type',
    'Tank Number',
    'Dip Reading', 
    'Net Stock',
    'Opening Stock', 
    'Receipt Quantity', 
    'Closing Stock', 
    'Sales per Tank Stock',
    'Actual Meter Sales',
    'Stock Variation'
  ];
  
  // Convert readings to CSV rows
  const rows: any[] = [];
  
  readings.forEach(reading => {
    if (reading.tanks) {
      reading.tanks.forEach((tank: any) => {
        rows.push([
          new Date(reading.date).toLocaleDateString(),
          reading.fuel_type,
          tank.tank_number,
          tank.dip_reading.toFixed(2),
          tank.net_stock.toFixed(2),
          reading.opening_stock.toFixed(2),
          reading.receipt_quantity ? reading.receipt_quantity.toFixed(2) : '0.00',
          reading.closing_stock.toFixed(2),
          reading.sales_per_tank_stock.toFixed(2),
          reading.actual_meter_sales.toFixed(2),
          reading.stock_variation.toFixed(2)
        ]);
      });
    } else {
      // For backward compatibility
      rows.push([
        new Date(reading.date).toLocaleDateString(),
        reading.fuel_type,
        1,
        reading.dip_reading.toFixed(2),
        reading.opening_stock.toFixed(2),
        reading.opening_stock.toFixed(2),
        reading.receipt_quantity ? reading.receipt_quantity.toFixed(2) : '0.00',
        reading.closing_stock.toFixed(2),
        reading.sales_per_tank_stock.toFixed(2),
        reading.actual_meter_sales.toFixed(2),
        reading.stock_variation.toFixed(2)
      ]);
    }
  });
  
  return { headers, rows };
};

// Export readings as CSV
export const exportReadingsAsCSV = (readings: any[]) => {
  const { headers, rows } = prepareExportData(readings);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create a blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `daily_readings_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
