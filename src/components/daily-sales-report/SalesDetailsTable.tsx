
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateUtils';

interface SalesData {
  date: string;
  totalSales: number;
  totalQuantity: number;
  fuelTypes: Record<string, { sales: number; quantity: number }>;
}

interface SalesDetailsTableProps {
  salesData: SalesData[];
  isLoading: boolean;
}

const SalesDetailsTable = ({ salesData, isLoading }: SalesDetailsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sales Details</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading data...</p>
        ) : salesData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Sales (₹)</TableHead>
                  <TableHead>Total Quantity (L)</TableHead>
                  <TableHead>Fuel Types</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map(data => (
                  <TableRow key={data.date}>
                    <TableCell>{formatDate(data.date)}</TableCell>
                    <TableCell>₹{data.totalSales.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{data.totalQuantity.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {Object.entries(data.fuelTypes).map(([fuelType, { sales, quantity }]) => (
                          <div key={fuelType} className="text-xs">
                            {fuelType}: {quantity.toLocaleString('en-IN')} L (₹{sales.toLocaleString('en-IN')})
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No sales data available for the selected date range</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesDetailsTable;
