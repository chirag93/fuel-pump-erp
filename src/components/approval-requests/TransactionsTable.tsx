
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/utils/formatUtils';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  customer_name?: string;
  vehicle_number?: string;
  fuel_type: string;
  quantity: number;
  payment_method: string;
  source: string;
  staff_name?: string;
  fuel_pump_id?: string;
  fuel_pump_name?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onApprove: (transaction: Transaction) => void;
  onReject: (transaction: Transaction) => void;
  showFuelPumpInfo?: boolean;
}

const TransactionsTable = ({ 
  transactions, 
  isLoading, 
  onApprove, 
  onReject,
  showFuelPumpInfo = false
}: TransactionsTableProps) => {
  const [fuelPumpNames, setFuelPumpNames] = useState<Record<string, string>>({});
  
  // Fetch fuel pump names for super admin view
  useEffect(() => {
    if (showFuelPumpInfo && transactions.length > 0) {
      const fetchFuelPumpNames = async () => {
        // Get unique fuel pump IDs
        const uniquePumpIds = [...new Set(transactions.map(t => t.fuel_pump_id).filter(Boolean))];
        
        if (uniquePumpIds.length > 0) {
          const { data } = await supabase
            .from('fuel_pumps')
            .select('id, name')
            .in('id', uniquePumpIds);
            
          if (data) {
            const pumpMap: Record<string, string> = {};
            data.forEach(pump => {
              pumpMap[pump.id] = pump.name;
            });
            setFuelPumpNames(pumpMap);
          }
        }
      };
      
      fetchFuelPumpNames();
    }
  }, [transactions, showFuelPumpInfo]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pending transaction approvals
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Fuel</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Staff</TableHead>
          {showFuelPumpInfo && <TableHead>Fuel Pump</TableHead>}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{formatDate(transaction.date)}</TableCell>
            <TableCell>{transaction.customer_name || 'Walk-in'}</TableCell>
            <TableCell>{transaction.vehicle_number || 'N/A'}</TableCell>
            <TableCell>{transaction.fuel_type}</TableCell>
            <TableCell>{transaction.quantity} L</TableCell>
            <TableCell>{formatCurrency(transaction.amount)}</TableCell>
            <TableCell>
              <Badge variant={transaction.payment_method === 'Cash' ? 'default' : 'outline'}>
                {transaction.payment_method}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={transaction.source === 'mobile' ? 'secondary' : 'outline'}>
                {transaction.source}
              </Badge>
            </TableCell>
            <TableCell>{transaction.staff_name || 'N/A'}</TableCell>
            {showFuelPumpInfo && (
              <TableCell>
                {transaction.fuel_pump_id ? 
                  fuelPumpNames[transaction.fuel_pump_id] || 'Unknown' : 
                  'N/A'
                }
              </TableCell>
            )}
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onApprove(transaction)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={() => onReject(transaction)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TransactionsTable;
