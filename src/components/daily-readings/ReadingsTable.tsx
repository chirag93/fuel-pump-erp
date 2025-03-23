import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TankReading {
  tank_number: number;
  dip_reading: number;
  net_stock: number;
}

interface DailyReading {
  id: string;
  date: string;
  fuel_type: string;
  dip_reading: number;
  net_stock: number;
  opening_stock: number;
  receipt_quantity: number;
  closing_stock: number;
  sales_per_tank_stock: number;
  actual_meter_sales: number;
  stock_variation: number;
  created_at?: string;
  tank_number: number;
  tanks?: TankReading[];
}

interface ReadingsTableProps {
  readings: DailyReading[];
  handleOpenDialog: (reading?: DailyReading) => void;
  handleOpenDeleteDialog: (reading: DailyReading) => void;
}

const ReadingsTable = ({ readings, handleOpenDialog, handleOpenDeleteDialog }: ReadingsTableProps) => {
  const isMobile = useIsMobile();
  
  // Format the stock variation to include + sign if positive
  const formatStockVariation = (value: number) => {
    return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };
  
  // Different table layout for mobile
  if (isMobile) {
    return (
      <div className="space-y-4">
        {readings.map((reading) => (
          <div 
            key={reading.id} 
            className="border rounded-lg p-3 bg-card"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="font-medium">{new Date(reading.date).toLocaleDateString()}</div>
                <div className="text-sm text-muted-foreground">{reading.fuel_type}</div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(reading)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteDialog(reading)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Opening</span>
                <span>{reading.opening_stock.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-muted-foreground">Closing</span>
                <span>{reading.closing_stock.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-muted-foreground">Tank Sales</span>
                <span>
                  {typeof reading.sales_per_tank_stock === 'number' 
                    ? reading.sales_per_tank_stock.toFixed(2) 
                    : (reading.opening_stock + (reading.receipt_quantity || 0) - reading.closing_stock).toFixed(2)}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-muted-foreground">Meter Sales</span>
                <span>{reading.actual_meter_sales.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col col-span-2">
                <span className="text-muted-foreground">Stock Variation</span>
                <span className={
                  reading.stock_variation > 0 
                    ? "text-green-700" 
                    : reading.stock_variation < 0 
                      ? "text-[#ea384c]" 
                      : ""
                }>
                  {typeof reading.stock_variation === 'number'
                    ? formatStockVariation(reading.stock_variation)
                    : formatStockVariation(reading.actual_meter_sales - (reading.opening_stock + (reading.receipt_quantity || 0) - reading.closing_stock))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Desktop table layout (unchanged)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Fuel Type</TableHead>
          <TableHead>Tanks</TableHead>
          <TableHead>Opening Stock</TableHead>
          <TableHead>Receipt Quantity</TableHead>
          <TableHead>Closing Stock</TableHead>
          <TableHead>Sales per Tank</TableHead>
          <TableHead>Actual Meter Sales</TableHead>
          <TableHead>Stock Variation</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {readings.map((reading) => (
          <TableRow key={reading.id}>
            <TableCell>{new Date(reading.date).toLocaleDateString()}</TableCell>
            <TableCell>{reading.fuel_type}</TableCell>
            <TableCell>
              {reading.tanks ? (
                <div className="flex flex-col gap-1">
                  {reading.tanks.map((tank: TankReading, index: number) => (
                    <div key={`${reading.id}-tank-${tank.tank_number}-${index}`} className="text-xs">
                      Tank {tank.tank_number}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs">
                  Tank 1
                </div>
              )}
            </TableCell>
            <TableCell>{reading.opening_stock.toFixed(2)}</TableCell>
            <TableCell>{reading.receipt_quantity ? reading.receipt_quantity.toFixed(2) : '-'}</TableCell>
            <TableCell>{reading.closing_stock.toFixed(2)}</TableCell>
            <TableCell>
              {typeof reading.sales_per_tank_stock === 'number' 
                ? reading.sales_per_tank_stock.toFixed(2) 
                : (reading.opening_stock + (reading.receipt_quantity || 0) - reading.closing_stock).toFixed(2)}
            </TableCell>
            <TableCell>{reading.actual_meter_sales.toFixed(2)}</TableCell>
            <TableCell 
              className={
                reading.stock_variation > 0 
                  ? "bg-[#F2FCE2] text-green-700" 
                  : reading.stock_variation < 0 
                    ? "bg-red-50 text-[#ea384c]" 
                    : ""
              }
            >
              {typeof reading.stock_variation === 'number'
                ? formatStockVariation(reading.stock_variation)
                : formatStockVariation(reading.actual_meter_sales - (reading.opening_stock + (reading.receipt_quantity || 0) - reading.closing_stock))}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(reading)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteDialog(reading)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ReadingsTable;
