
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
          <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Payment</TableHead>
                  <TableHead className="hidden lg:table-cell">Indent ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden sm:table-cell whitespace-nowrap">{transaction.vehicle_number || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{transaction.fuel_type}</TableCell>
                    <TableCell className="whitespace-nowrap">{transaction.quantity} L</TableCell>
                    <TableCell className="whitespace-nowrap">₹{transaction.amount.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize whitespace-nowrap">{transaction.payment_method}</TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-nowrap">{transaction.indent_id || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
