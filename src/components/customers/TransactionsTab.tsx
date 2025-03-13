
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { Transaction } from '@/integrations/supabase/client';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

interface TransactionsTabProps {
  transactions: TransactionWithDetails[];
  customerName?: string;
}

const TransactionsTab = ({ transactions, customerName = 'Customer' }: TransactionsTabProps) => {
  const exportTransactions = () => {
    // Define CSV headers
    const headers = ['Date', 'Vehicle', 'Fuel Type', 'Quantity', 'Amount', 'Indent ID'];
    
    // Convert transactions to CSV rows
    const rows = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.vehicle_number || 'N/A',
      transaction.fuel_type,
      `${transaction.quantity.toFixed(2)}`,
      `${transaction.amount.toFixed(2)}`,
      transaction.indent_id || '-'
    ]);
    
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
    link.setAttribute('download', `${customerName}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fuel Transactions</CardTitle>
          {transactions.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportTransactions} className="flex items-center gap-2">
              <Download size={16} />
              Export CSV
            </Button>
          )}
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
