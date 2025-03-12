
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { Transaction } from '@/integrations/supabase/client';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

interface TransactionsTabProps {
  transactions: TransactionWithDetails[];
}

const TransactionsTab = ({ transactions }: TransactionsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fuel Transactions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Indent ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.vehicle_number || 'N/A'}</TableCell>
                  <TableCell>{transaction.fuel_type}</TableCell>
                  <TableCell>{transaction.quantity} L</TableCell>
                  <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell>{transaction.indent_id || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
