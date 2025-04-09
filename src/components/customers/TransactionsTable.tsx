
import { useState } from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Transaction, Customer } from '@/integrations/supabase/client';
import BillPreviewDialog from '@/components/indent/BillPreviewDialog';
import { TransactionWithDetails } from '@/integrations/transactions';

interface TransactionsTableProps {
  transactions: TransactionWithDetails[];
  customer: Customer;
}

const TransactionsTable = ({ transactions, customer }: TransactionsTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  // Sort transactions by date in descending order (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No transactions found for this customer in the selected date range.
      </p>
    );
  }

  const handleGenerateBill = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setBillDialogOpen(true);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Fuel Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            {customer.balance !== null && <TableHead>Status</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {transaction.date ? format(new Date(transaction.date), 'dd/MM/yyyy') : 'Unknown'}
              </TableCell>
              <TableCell>{transaction.vehicle_number || 'N/A'}</TableCell>
              <TableCell>{transaction.fuel_type}</TableCell>
              <TableCell>
                {transaction.fuel_type === 'PAYMENT' 
                  ? 'N/A' 
                  : `${transaction.quantity || 0} L`
                }
              </TableCell>
              <TableCell className={transaction.fuel_type === 'PAYMENT' ? 'text-green-600 font-medium' : ''}>
                {transaction.fuel_type === 'PAYMENT'
                  ? `INR ${transaction.amount}`
                  : `INR ${transaction.amount}`
                }
              </TableCell>
              <TableCell>{transaction.payment_method}</TableCell>
              {customer.balance !== null && (
                <TableCell>
                  {transaction.fuel_type === 'PAYMENT' ? (
                    <span className="text-green-600 font-medium">Payment</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Credit</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                {transaction.fuel_type !== 'PAYMENT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateBill(transaction)}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Bill
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedTransaction && (
        <BillPreviewDialog
          open={billDialogOpen}
          onOpenChange={setBillDialogOpen}
          transaction={selectedTransaction}
          vehicleNumber={selectedTransaction.vehicle_number}
          customerName={customer.name}
        />
      )}
    </div>
  );
};

export default TransactionsTable;
