
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Customer, Transaction } from '@/integrations/supabase/client';
import RecordPaymentDialog from './RecordPaymentDialog';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

interface TransactionsTabProps {
  transactions: TransactionWithDetails[];
  customerName: string;
  customer: Customer;
}

const TransactionsTab = ({ transactions, customerName, customer }: TransactionsTabProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePaymentRecorded = () => {
    // Trigger a refresh of the component
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <Button 
          onClick={() => setIsPaymentDialogOpen(true)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions for {customerName}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No transactions found for this customer.
            </p>
          ) : (
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
                          ? `-₹${transaction.amount}`
                          : `₹${transaction.amount}`
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
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog 
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        customer={customer}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
};

export default TransactionsTab;
