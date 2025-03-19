
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';
import { supabase, Transaction } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface RecentTransactionsTableProps {
  refreshTrigger?: number;
}

export const RecentTransactionsTable = ({ refreshTrigger = 0 }: RecentTransactionsTableProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            customers(name),
            vehicles(number)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Process the data to include customer_name and vehicle_number
        const processedData = data.map(transaction => ({
          ...transaction,
          customer_name: transaction.customers?.name || 'Unknown',
          vehicle_number: transaction.vehicles?.number || 'Unknown'
        }));

        setTransactions(processedData as Transaction[]);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [refreshTrigger]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          The most recent 10 fuel transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p>No recent transactions found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Final Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date ? format(new Date(transaction.date), 'dd/MM/yyyy') : 'Unknown'}</TableCell>
                  <TableCell>{transaction.customer_name || 'Unknown'}</TableCell>
                  <TableCell>{transaction.vehicle_number || 'Unknown'}</TableCell>
                  <TableCell>{transaction.fuel_type}</TableCell>
                  <TableCell>{transaction.quantity} L</TableCell>
                  <TableCell>₹{transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>₹{(transaction.discount_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>₹{(transaction.amount - (transaction.discount_amount || 0)).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Link to="/all-transactions">
          <Button variant="outline" className="gap-2">
            View all transactions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentTransactionsTable;
