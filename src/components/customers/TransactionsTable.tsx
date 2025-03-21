
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction, Customer } from '@/integrations/supabase/client';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

interface TransactionsTableProps {
  transactions: TransactionWithDetails[];
  customer: Customer;
}

const TransactionsTable = ({ transactions, customer }: TransactionsTableProps) => {
  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No transactions found for this customer in the selected date range.
      </p>
    );
  }

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
