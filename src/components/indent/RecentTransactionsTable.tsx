
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface RecentTransaction extends Transaction {
  customer_name?: string;
  vehicle_number?: string;
}

interface RecentTransactionsTableProps {
  refreshTrigger?: number;
}

export const RecentTransactionsTable = ({ refreshTrigger = 0 }: RecentTransactionsTableProps) => {
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRecentTransactions();
  }, [refreshTrigger]); // Add refreshTrigger to dependency array

  const fetchRecentTransactions = async () => {
    setIsTransactionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name),
          vehicles(number)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedTransactions: RecentTransaction[] = data.map(item => ({
          ...item,
          customer_name: item.customers?.name || 'Walk-in Customer',
          vehicle_number: item.vehicles?.number || 'N/A'
        }));
        setRecentTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load recent transactions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
          </div>
          <CardDescription>
            Last 5 transactions recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTransactionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <FileText className="mr-2 h-4 w-4" />
              No transactions found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.customer_name}</TableCell>
                    <TableCell>{transaction.vehicle_number}</TableCell>
                    <TableCell>{transaction.fuel_type}</TableCell>
                    <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>{transaction.quantity} L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end mt-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/all-transactions" className="flex items-center">
            View all transactions 
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </>
  );
};
