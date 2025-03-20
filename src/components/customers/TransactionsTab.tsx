
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Customer, Transaction } from '@/integrations/supabase/client';
import RecordPaymentDialog from './RecordPaymentDialog';
import { useCustomerData } from './hooks/useCustomerData';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

interface TransactionsTabProps {
  transactions: TransactionWithDetails[];
  customerName: string;
  customer: Customer;
  customerId: string;
}

const TransactionsTab = ({ transactions: initialTransactions, customerName, customer, customerId }: TransactionsTabProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { transactions, refreshData } = useCustomerData(customerId);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  
  const handlePaymentRecorded = () => {
    // Refresh the data after payment is recorded
    refreshData();
  };

  // Use the latest transactions from the hook, falling back to initial transactions if needed
  const displayTransactions = transactions.length > 0 ? transactions : initialTransactions;

  // Filter transactions by date range if selected
  const filteredTransactions = displayTransactions.filter(transaction => {
    if (!dateRange.from && !dateRange.to) return true;
    
    const transactionDate = new Date(transaction.date);
    
    if (dateRange.from && dateRange.to) {
      return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    }
    
    if (dateRange.from) {
      return transactionDate >= dateRange.from;
    }
    
    if (dateRange.to) {
      return transactionDate <= dateRange.to;
    }
    
    return true;
  });

  const resetDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const generateGSTInvoice = async () => {
    if (!filteredTransactions.length) {
      toast({
        title: "No transactions to generate invoice",
        description: "Please select a date range with transactions",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingInvoice(true);

    try {
      // Get business details for the invoice
      const { data: businessData } = await supabase
        .from('fuel_pumps')
        .select('*')
        .single();

      // Calculate totals
      let totalAmount = 0;
      let totalQuantity = 0;
      
      // Count only fuel transactions, not payments
      const fuelTransactions = filteredTransactions.filter(t => t.fuel_type !== 'PAYMENT');
      
      fuelTransactions.forEach(t => {
        totalAmount += Number(t.amount) || 0;
        totalQuantity += Number(t.quantity) || 0;
      });

      // Calculate GST (assuming 18% GST)
      const gstRate = 0.18;
      const gstAmount = totalAmount * gstRate;
      const baseAmount = totalAmount - gstAmount;

      // Generate the invoice content
      const invoiceDate = new Date().toLocaleDateString();
      const invoicePeriod = dateRange.from && dateRange.to 
        ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
        : 'All time';

      // Create CSV data
      let csvContent = 'data:text/csv;charset=utf-8,';
      
      // Add headers
      csvContent += 'GST INVOICE\r\n\r\n';
      csvContent += `Invoice Date: ${invoiceDate}\r\n`;
      csvContent += `Period: ${invoicePeriod}\r\n\r\n`;
      
      // Seller details
      csvContent += 'Seller Details:\r\n';
      csvContent += `${businessData?.name || 'Fuel Station'}\r\n`;
      csvContent += `${businessData?.address || 'Address not available'}\r\n`;
      csvContent += `GSTIN: ${businessData?.gst_number || 'Not available'}\r\n\r\n`;
      
      // Buyer details
      csvContent += 'Buyer Details:\r\n';
      csvContent += `${customer.name}\r\n`;
      csvContent += `Contact: ${customer.contact}\r\n`;
      csvContent += `Phone: ${customer.phone}\r\n`;
      csvContent += `GSTIN: ${customer.gst}\r\n\r\n`;
      
      // Transaction details
      csvContent += 'Date,Vehicle,Fuel Type,Quantity (L),Amount (₹),Payment Method\r\n';
      
      fuelTransactions.forEach(trans => {
        csvContent += `${format(new Date(trans.date), 'dd/MM/yyyy')},`;
        csvContent += `${trans.vehicle_number || 'N/A'},`;
        csvContent += `${trans.fuel_type},`;
        csvContent += `${trans.quantity || 0},`;
        csvContent += `${trans.amount},`;
        csvContent += `${trans.payment_method}\r\n`;
      });
      
      // Summary
      csvContent += '\r\nSummary:\r\n';
      csvContent += `Total Quantity: ${totalQuantity.toFixed(2)} L\r\n`;
      csvContent += `Base Amount: ₹${baseAmount.toFixed(2)}\r\n`;
      csvContent += `CGST (${(gstRate/2)*100}%): ₹${(gstAmount/2).toFixed(2)}\r\n`;
      csvContent += `SGST (${(gstRate/2)*100}%): ₹${(gstAmount/2).toFixed(2)}\r\n`;
      csvContent += `Total Amount: ₹${totalAmount.toFixed(2)}\r\n`;
      
      // Add signature line
      csvContent += '\r\n\r\nAuthorized Signatory';
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${customer.name}-GST-Invoice-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      toast({
        title: "Invoice Generated",
        description: "The GST invoice has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error Generating Invoice",
        description: "There was a problem generating the invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-1">
                <CalendarIcon className="h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="p-3 border-t border-border flex justify-between">
                <Button variant="ghost" onClick={resetDateRange} size="sm">Reset</Button>
                <Button size="sm" onClick={() => {}}>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            onClick={generateGSTInvoice} 
            variant="outline"
            className="gap-1"
            disabled={isGeneratingInvoice}
          >
            <FileText className="h-4 w-4" />
            {isGeneratingInvoice ? "Generating..." : "Generate GST Invoice"}
          </Button>
          
          <Button 
            onClick={() => setIsPaymentDialogOpen(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {dateRange.from ? (
              dateRange.to ? (
                <>Transactions for {customerName}: {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}</>
              ) : (
                <>Transactions for {customerName} from {format(dateRange.from, "MMM d, yyyy")}</>
              )
            ) : (
              dateRange.to ? (
                <>Transactions for {customerName} until {format(dateRange.to, "MMM d, yyyy")}</>
              ) : (
                <>All Transactions for {customerName}</>
              )
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No transactions found for this customer in the selected date range.
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
                  {filteredTransactions.map((transaction) => (
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
                          ? `₹${transaction.amount}`
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
        customerId={customer.id}
        customerName={customerName}
        currentBalance={customer.balance}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
};

export default TransactionsTab;
