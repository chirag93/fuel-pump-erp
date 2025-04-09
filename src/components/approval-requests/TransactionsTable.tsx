
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Transaction } from '@/integrations/supabase/client';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onApprove: (transaction: Transaction) => void;
  onReject: (transaction: Transaction) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
  transactions, 
  isLoading, 
  onApprove, 
  onReject 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">No pending transactions found</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Fuel Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.id.substring(0, 8)}...</TableCell>
              <TableCell>{transaction.customer_name || 'Unknown'}</TableCell>
              <TableCell>{transaction.vehicle_number || 'Unknown'}</TableCell>
              <TableCell>{transaction.staff_name || 'Unknown'}</TableCell>
              <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>{transaction.fuel_type}</TableCell>
              <TableCell>₹{transaction.amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant="outline">{transaction.source || 'web'}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={() => onApprove(transaction)} 
                    size="sm" 
                    variant="outline"
                    className="h-8 gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => onReject(transaction)} 
                    size="sm" 
                    variant="outline"
                    className="h-8 gap-1"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
