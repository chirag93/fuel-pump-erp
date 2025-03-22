
import React, { useState } from 'react';
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
import { Receipt, Search, Printer, FileCheck, FileEdit, FileX } from 'lucide-react';

const InvoiceProcessing = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  
  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
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
  
  const handleBatchProcess = () => {
    setIsBatchProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsBatchProcessing(false);
      toast({
        title: "Invoices Processed",
        description: `Successfully processed ${selectedInvoices.length} invoices.`,
      });
      setSelectedInvoices([]);
    }, 1500);
  };
  
  // Sample invoice data
  const invoices = [
    { id: 'INV-001', customer: 'Acme Transport', date: new Date(2023, 5, 15), amount: 12500, status: 'pending' },
    { id: 'INV-002', customer: 'Global Logistics', date: new Date(2023, 5, 18), amount: 8750, status: 'approved' },
    { id: 'INV-003', customer: 'City Fuels', date: new Date(2023, 5, 20), amount: 15200, status: 'pending' },
    { id: 'INV-004', customer: 'Express Carriers', date: new Date(2023, 5, 22), amount: 9300, status: 'rejected' },
    { id: 'INV-005', customer: 'Prime Motors', date: new Date(2023, 5, 25), amount: 11800, status: 'pending' },
    { id: 'INV-006', customer: 'Royal Transport', date: new Date(2023, 5, 28), amount: 7600, status: 'approved' },
  ];
  
  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <AccountingPageLayout 
      title="Invoice Processing" 
      description="Process, approve, and manage customer invoices."
    >
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pending Invoices</CardTitle>
                  <CardDescription>
                    Review and process pending invoices
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
                  <Button 
                    onClick={handleBatchProcess} 
                    disabled={selectedInvoices.length === 0 || isBatchProcessing}
                  >
                    {isBatchProcessing ? "Processing..." : "Process Selected"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={handleSelectAllChange}
                      />
                    </TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={(checked) => handleInvoiceSelect(invoice.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>{format(invoice.date, 'dd/MM/yyyy')}</TableCell>
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
                          <Button variant="ghost" size="icon">
                            <FileCheck className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FileX className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
        
        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Invoices</CardTitle>
              <CardDescription>
                View and manage approved invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section shows all approved invoices.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Invoices</CardTitle>
              <CardDescription>
                View and manage rejected invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section shows all rejected invoices.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>
                View and manage all invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section shows all invoices regardless of status.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AccountingPageLayout>
  );
};

export default InvoiceProcessing;
