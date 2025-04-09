
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/hooks/useCustomerData';
import RecordPaymentDialog from './RecordPaymentDialog';
import { useCustomerData } from '../customers/hooks/useCustomerData';
import { DateRange } from 'react-day-picker';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import TransactionActions from './TransactionActions';
import TransactionsTable from './TransactionsTable';
import { generateGSTInvoice } from '@/utils/invoiceGenerator';
import { Transaction } from '@/hooks/useCustomerData';

interface TransactionsTabProps {
  transactions: Transaction[];
  customerName: string;
  customer: Customer;
  customerId: string;
}

const TransactionsTab = ({ transactions: initialTransactions, customerName, customer, customerId }: TransactionsTabProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { transactions, refreshData } = useCustomerData(customerId);
  const [dateRange, setDateRange] = useState<DateRange>({
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

  const handleGenerateInvoice = async (selectedDateRange: DateRange) => {
    if (!selectedDateRange.from || !selectedDateRange.to) {
      toast({
        title: "Date Selection Required",
        description: "Please select both start and end dates for the invoice period.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingInvoice(true);
    
    try {
      // Apply the selected date range rather than the filter range
      const invoiceDateRange = {
        from: selectedDateRange.from,
        to: selectedDateRange.to
      };
      
      // Filter transactions based on the selected date range for the invoice
      const invoiceTransactions = displayTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        
        if (invoiceDateRange.from && invoiceDateRange.to) {
          return transactionDate >= invoiceDateRange.from && transactionDate <= invoiceDateRange.to;
        }
        
        return true;
      });
      
      if (invoiceTransactions.length === 0) {
        toast({
          title: "No Transactions",
          description: "There are no transactions in the selected date range.",
          variant: "destructive"
        });
        setIsGeneratingInvoice(false);
        return;
      }
      
      // Process transactions to ensure correct typing
      const formattedTransactions = invoiceTransactions.map(transaction => ({
        ...transaction,
        source: 'web' as 'mobile' | 'web', // Default to web if not specified
      }));
      
      const result = await generateGSTInvoice(customer, formattedTransactions, invoiceDateRange);
      
      toast({
        title: result.success ? "Invoice Generated" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
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
        <TransactionActions 
          dateRange={dateRange}
          setDateRange={setDateRange}
          resetDateRange={resetDateRange}
          onGenerateInvoice={handleGenerateInvoice}
          isGeneratingInvoice={isGeneratingInvoice}
          onRecordPayment={() => setIsPaymentDialogOpen(true)}
          customer={customer}
        />
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
          <TransactionsTable 
            transactions={filteredTransactions}
            customer={customer}
          />
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
