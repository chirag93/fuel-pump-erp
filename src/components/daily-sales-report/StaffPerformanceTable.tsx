
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StaffData {
  id: string;
  staffName: string;
  totalSales: number;
  transactionCount: number;
}

interface StaffPerformanceTableProps {
  staffData: StaffData[];
  totalSales: number;
  isLoading: boolean;
}

const StaffPerformanceTable = ({ staffData, totalSales, isLoading }: StaffPerformanceTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading data...</p>
        ) : staffData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Total Sales (₹)</TableHead>
                  <TableHead>Transaction Count</TableHead>
                  <TableHead>Average Sale (₹)</TableHead>
                  <TableHead>Performance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffData.map(staff => (
                  <TableRow key={staff.id}>
                    <TableCell>{staff.staffName}</TableCell>
                    <TableCell>₹{staff.totalSales.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{staff.transactionCount}</TableCell>
                    <TableCell>
                      ₹{(staff.totalSales / staff.transactionCount).toLocaleString('en-IN', { 
                        maximumFractionDigits: 2 
                      })}
                    </TableCell>
                    <TableCell>
                      {totalSales > 0 ? ((staff.totalSales / totalSales) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No staff performance data available for the selected date range</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffPerformanceTable;
