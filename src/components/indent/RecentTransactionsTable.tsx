
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase, Transaction } from '@/integrations/supabase/client';
import BillPreviewDialog from './BillPreviewDialog';
import { getFuelPumpId } from '@/integrations/utils';
import { toast } from "@/hooks/use-toast";

interface ExtendedTransaction extends Transaction {
  customer_name?: string;
  vehicle_number?: string;
}

interface RecentTransactionsTableProps {
  refreshTrigger: number;
}

export const RecentTransactionsTable = ({ refreshTrigger }: RecentTransactionsTableProps) => {
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      setIsLoading(true);
      try {
        // Get the fuel pump ID
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.error('No fuel pump ID available');
          toast({
            title: "Authentication Required",
            description: "Please log in with a fuel pump account to view transactions",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Get the last 5 transactions with customer and vehicle info, filtered by fuel pump ID
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            customers(name),
            vehicles(number)
          `)
          .eq('fuel_pump_id', fuelPumpId) // Add fuel pump ID filter
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        
        // Process the data to flatten the structure
        const processedData = data.map(transaction => ({
          ...transaction,
          customer_name: transaction.customers?.name,
          vehicle_number: transaction.vehicles?.number
        })) as ExtendedTransaction[];
        
        setTransactions(processedData);
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentTransactions();
  }, [refreshTrigger]);

  const handleGenerateBill = (transaction: ExtendedTransaction) => {
    setSelectedTransaction(transaction);
    setBillDialogOpen(true);
  };

  if (isLoading) {
    return <p className="text-center py-4">Loading recent transactions...</p>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No recent transactions found</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Fuel Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>{transaction.customer_name || 'N/A'}</TableCell>
                <TableCell>{transaction.vehicle_number || 'N/A'}</TableCell>
                <TableCell>{transaction.fuel_type}</TableCell>
                <TableCell>
                  {transaction.fuel_type === 'PAYMENT' 
                    ? 'N/A' 
                    : `${transaction.quantity} L`
                  }
                </TableCell>
                <TableCell>
                  {transaction.fuel_type === 'PAYMENT'
                    ? <span className="text-green-500">INR {transaction.amount}</span>
                    : `INR ${transaction.amount}`
                  }
                </TableCell>
                <TableCell>{transaction.payment_method}</TableCell>
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
      </div>

      {selectedTransaction && (
        <BillPreviewDialog
          open={billDialogOpen}
          onOpenChange={setBillDialogOpen}
          transaction={selectedTransaction}
          vehicleNumber={selectedTransaction.vehicle_number}
          customerName={selectedTransaction.customer_name}
        />
      )}
    </div>
  );
};
