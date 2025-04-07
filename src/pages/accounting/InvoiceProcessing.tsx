import React, { useState, useEffect } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Receipt, Search, Printer, FileCheck, FileX, Loader2, FilePenLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { getFuelPumpId } from '@/integrations/utils';
import { generateGSTInvoice } from '@/utils/invoiceGenerator';
import { getCustomerById } from '@/integrations/customers';

interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  date: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

const InvoiceProcessing = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [showUpdateDialog, setShowUpdateDialog] = useState<boolean>(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        // Get the current fuel pump ID
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          toast({
            title: "Authentication Required",
            description: "Please log in to view invoice data",
            variant: "destructive"
          });
          setInvoices([]);
          setIsLoading(false);
          return;
        }
        
        console.log('Fetching invoices with pump_id:', fuelPumpId);
        
        // Using the explicit parameter name matching the database function
        const { data, error } = await supabase
          .rpc('get_invoices_with_customer_names', { pump_id: fuelPumpId });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        console.log('Fetched invoices:', data);
        
        // Type assertion to match our Invoice interface
        const fetchedInvoices = data as Invoice[];
        
        // Filter based on active tab
        const filteredInvoices = activeTab === 'all' 
          ? fetchedInvoices 
          : fetchedInvoices.filter(invoice => invoice.status === activeTab);
        
        setInvoices(filteredInvoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again.",
          variant: "destructive",
        });
        // Set empty array as fallback
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, [activeTab]);
  
  const handlePrintInvoice = async (invoiceId: string) => {
    try {
      setIsPrinting(invoiceId);
      
      // Get the current fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate invoice",
          variant: "destructive"
        });
        return;
      }
      
      // Find the invoice in our state
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      
      // Get the customer data
      const customer = await getCustomerById(invoice.customer_id);
      if (!customer) {
        throw new Error("Customer not found");
      }
      
      // Get all transactions for this invoice date
      // We're fetching transactions from the invoice date
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', invoice.customer_id)
        .eq('date', invoice.date)
        .eq('fuel_pump_id', fuelPumpId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If no transactions found, show warning but still attempt to generate invoice
      if (!transactionsData || transactionsData.length === 0) {
        toast({
          title: "Warning",
          description: "No transactions found for this invoice date. The invoice may be incomplete.",
        });
      }
      
      // Process transactions to ensure correct typing of source field
      const formattedTransactions = transactionsData?.map(transaction => ({
        ...transaction,
        // Ensure source is properly typed as 'mobile' | 'web'
        source: (transaction.source === 'mobile' ? 'mobile' : 'web') as 'mobile' | 'web',
        // Add vehicle_number property expected by TransactionWithDetails
        vehicle_number: 'Unknown' // We could fetch this if needed
      })) || [];
      
      // Generate and download the PDF
      const result = await generateGSTInvoice(customer, formattedTransactions, {
        from: new Date(invoice.date),
        to: new Date(invoice.date)
      });
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoice PDF",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(null);
    }
  };
  
  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };
  
  const handleInvoiceSelect = (invoiceId: string, checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId));
    }
  };
  
  const handleBatchProcess = async () => {
    setIsBatchProcessing(true);
    
    try {
      // Update status to approved for all selected invoices
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'approved' as const, 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedInvoices);
      
      if (error) throw error;
      
      // Update local state
      const updatedInvoices = invoices.map(invoice => 
        selectedInvoices.includes(invoice.id) 
          ? { ...invoice, status: 'approved' as const, updated_at: new Date().toISOString() } 
          : invoice
      );
      
      setInvoices(updatedInvoices);
      toast({
        title: "Invoices Processed",
        description: `Successfully processed ${selectedInvoices.length} invoices.`,
      });
      
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Error processing invoices:', error);
      toast({
        title: "Error",
        description: "Failed to process invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };
  
  const handleStatusUpdate = async (invoiceId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      // Get fuel pump ID to ensure we're updating the right invoice
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to update invoice status",
          variant: "destructive"
        });
        return;
      }
      
      // Update the invoice status in the database
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', invoiceId)
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) throw error;
      
      // Update the local state with properly typed status
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: newStatus, updated_at: new Date().toISOString() } 
          : invoice
      ));
      
      toast({
        title: `Invoice ${newStatus}`,
        description: `Invoice ${invoiceId} has been ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const openUpdateDialog = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setUpdatedStatus(invoice.status);
    setShowUpdateDialog(true);
  };
  
  const handleSaveUpdate = async () => {
    if (!currentInvoice) return;
    
    await handleStatusUpdate(currentInvoice.id, updatedStatus);
    setShowUpdateDialog(false);
  };
  
  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <AccountingPageLayout 
      title="Invoice Processing" 
      description="Process, approve, and manage customer invoices."
    >
      <Tabs 
        defaultValue="pending" 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          setSelectedInvoices([]);
        }}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
        </TabsList>
        
        {['pending', 'approved', 'rejected', 'all'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-6">
            <Card>
              <CardHeader className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {tabValue === 'pending' && 'Pending Invoices'}
                      {tabValue === 'approved' && 'Approved Invoices'}
                      {tabValue === 'rejected' && 'Rejected Invoices'}
                      {tabValue === 'all' && 'All Invoices'}
                    </CardTitle>
                    <CardDescription>
                      {tabValue === 'pending' && 'Review and process pending invoices'}
                      {tabValue === 'approved' && 'View and manage approved invoices'}
                      {tabValue === 'rejected' && 'View and manage rejected invoices'}
                      {tabValue === 'all' && 'View and manage all invoices regardless of status'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search invoices..."
                        className="pl-8 w-[250px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {tabValue === 'pending' && (
                      <Button 
                        onClick={handleBatchProcess} 
                        disabled={selectedInvoices.length === 0 || isBatchProcessing}
                      >
                        {isBatchProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : "Process Selected"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tabValue === 'pending' && (
                          <TableHead className="w-[50px]">
                            <Checkbox 
                              checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                              onCheckedChange={handleSelectAllChange}
                            />
                          </TableHead>
                        )}
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            {tabValue === 'pending' && (
                              <TableCell>
                                <Checkbox 
                                  checked={selectedInvoices.includes(invoice.id)}
                                  onCheckedChange={(checked) => handleInvoiceSelect(invoice.id, checked)}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{invoice.customer_name}</TableCell>
                            <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                invoice.status === 'approved' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {invoice.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openUpdateDialog(invoice)}
                                  title="Update Status"
                                >
                                  <FilePenLine className="h-4 w-4" />
                                </Button>
                                {invoice.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleStatusUpdate(invoice.id, 'approved')}
                                      title="Approve"
                                    >
                                      <FileCheck className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleStatusUpdate(invoice.id, 'rejected')}
                                      title="Reject"
                                    >
                                      <FileX className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Print"
                                  onClick={() => handlePrintInvoice(invoice.id)}
                                  disabled={isPrinting === invoice.id}
                                >
                                  {isPrinting === invoice.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Printer className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={tabValue === 'pending' ? 7 : 6} className="text-center py-6 text-muted-foreground">
                            {searchTerm ? 'No invoices found matching your search' : 'No invoices found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <CardFooter className="flex justify-between py-4 px-6">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredInvoices.length} of {invoices.length} invoices
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled>Next</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Invoice Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>
              Change the status of invoice {currentInvoice?.id}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Invoice Details</h4>
              <p className="text-sm text-muted-foreground">
                Customer: {currentInvoice?.customer_name}<br />
                Amount: ₹{currentInvoice?.amount.toLocaleString()}<br />
                Date: {currentInvoice?.date ? format(new Date(currentInvoice.date), 'dd MMM yyyy') : ''}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={updatedStatus} 
                onValueChange={(value: 'pending' | 'approved' | 'rejected') => setUpdatedStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccountingPageLayout>
  );
};

export default InvoiceProcessing;
