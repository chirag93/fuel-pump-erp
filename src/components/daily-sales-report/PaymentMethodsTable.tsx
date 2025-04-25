
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PaymentMethodData {
  method: string;
  amount: number;
  percentage: number;
}

interface PaymentMethodsTableProps {
  paymentMethodData: PaymentMethodData[];
  isLoading: boolean;
}

const PaymentMethodsTable = ({ paymentMethodData, isLoading }: PaymentMethodsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading data...</p>
        ) : paymentMethodData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethodData.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>₹{payment.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{payment.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No payment method data available for the selected date range</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsTable;
