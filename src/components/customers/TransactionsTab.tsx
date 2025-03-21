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
import { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

interface TransactionsTabProps {
  transactions: TransactionWithDetails[];
  customerName: string;
  customer: Customer;
  customerId: string;
}

interface BusinessInfo {
  id?: string;
  business_name: string;
  gst_number: string;
  address: string;
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
      // Get business details for the invoice from business_settings table
      const { data: businessSettings, error: businessError } = await supabase
        .from('business_settings')
        .select('*')
        .single();

      if (businessError) {
        console.error('Error fetching business settings:', businessError);
        throw new Error('Could not fetch business information');
      }

      const businessInfo: BusinessInfo = businessSettings || {
        business_name: 'Fuel Station',
        gst_number: 'Not Available',
        address: 'Address not available'
      };

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

      // Create PDF document
      const pdf = new jsPDF();
      
      // Add logo/header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(businessInfo.business_name, 105, 20, { align: 'center' });
      
      // Add address and contact details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(businessInfo.address, 105, 28, { align: 'center' });
      
      const gstNumber = businessInfo.gst_number ? `GSTIN: ${businessInfo.gst_number}` : 'GSTIN: Not Available';
      pdf.text(gstNumber, 105, 34, { align: 'center' });
      
      // Add invoice title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text("TAX INVOICE", 105, 42, { align: 'center' });
      
      // Add a line
      pdf.line(14, 47, 196, 47);
      
      // Invoice details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice Date: ${invoiceDate}`, 14, 55);
      pdf.text(`Period: ${invoicePeriod}`, 14, 61);
      pdf.text(`Invoice No: INV-${new Date().getTime().toString().substring(0, 10)}`, 14, 67);
      
      // Customer details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Customer Details:", 14, 77);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${customer.name}`, 14, 84);
      pdf.text(`Contact: ${customer.contact}`, 14, 90);
      pdf.text(`Phone: ${customer.phone}`, 14, 96);
      pdf.text(`GSTIN: ${customer.gst || 'Not Available'}`, 14, 102);
      
      // Add transaction table
      autoTable(pdf, {
        head: [['Date', 'Vehicle', 'Fuel Type', 'Quantity (L)', 'Amount (INR)', 'Payment Method']],
        body: fuelTransactions.map(trans => [
          format(new Date(trans.date), 'dd/MM/yyyy'),
          trans.vehicle_number || 'N/A',
          trans.fuel_type,
          trans.quantity ? trans.quantity.toString() : '0',
          trans.amount.toString(),
          trans.payment_method
        ]),
        startY: 110,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Add summary
      const finalY = (pdf as any).lastAutoTable.finalY + 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Invoice Summary", 140, finalY);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Quantity: ${totalQuantity.toFixed(2)} L`, 140, finalY + 7);
      pdf.text(`Base Amount: INR ${baseAmount.toFixed(2)}`, 140, finalY + 14);
      pdf.text(`CGST (${(gstRate/2)*100}%): INR ${(gstAmount/2).toFixed(2)}`, 140, finalY + 21);
      pdf.text(`SGST (${(gstRate/2)*100}%): INR ${(gstAmount/2).toFixed(2)}`, 140, finalY + 28);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Amount: INR ${totalAmount.toFixed(2)}`, 140, finalY + 35);
      
      // Add footer
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 280);
      
      // Add signature line
      pdf.line(140, finalY + 50, 190, finalY + 50);
      pdf.text("Authorized Signature", 150, finalY + 55);
      
      // Terms and conditions
      pdf.setFontSize(8);
      pdf.text("Terms & Conditions:", 14, 255);
      pdf.text("1. This is a computer generated invoice and does not require a physical signature.", 14, 260);
      pdf.text("2. Please pay within 30 days of the invoice date.", 14, 265);
      pdf.text("3. For any queries related to this invoice, please contact us.", 14, 270);
      
      // Save the PDF
      pdf.save(`${customer.name}-GST-Invoice-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Invoice Generated",
        description: "The GST invoice has been generated and downloaded successfully",
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
