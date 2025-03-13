
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

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
                  {reading.tanks.map((tank: TankReading) => (
                    <div key={tank.tank_number} className="text-xs">
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
            <TableCell>{reading.opening_stock}</TableCell>
            <TableCell>{reading.receipt_quantity}</TableCell>
            <TableCell>{reading.closing_stock}</TableCell>
            <TableCell>{reading.sales_per_tank_stock}</TableCell>
            <TableCell>{reading.actual_meter_sales}</TableCell>
            <TableCell 
              className={
                reading.stock_variation > 0 
                  ? "bg-[#F2FCE2] text-green-700" 
                  : reading.stock_variation < 0 
                    ? "bg-red-50 text-[#ea384c]" 
                    : ""
              }
            >
              {reading.stock_variation}
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
