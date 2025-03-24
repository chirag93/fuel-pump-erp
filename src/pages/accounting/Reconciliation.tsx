
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/hooks/use-toast';
import { Search, Check, AlertCircle, DownloadCloud, Upload, RefreshCw } from 'lucide-react';

const Reconciliation = () => {
  const [reconciliationType, setReconciliationType] = useState<string>('bank');
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedTransactions(transactions.map(transaction => transaction.id));
    } else {
      setSelectedTransactions([]);
    }
  };
  
  const handleTransactionSelect = (transactionId: string, checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, transactionId]);
    } else {
      setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId));
    }
  };
  
  const handleReconcile = () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "No Transactions Selected",
        description: "Please select at least one transaction to reconcile.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Transactions Reconciled",
      description: `Successfully reconciled ${selectedTransactions.length} transactions.`,
    });
    
    // In a real app, this would update the database
    // For now, we'll just clear the selection to simulate completion
    setSelectedTransactions([]);
  };
  
  const handleImportStatement = () => {
    toast({
      title: "Import Statement",
      description: "The import statement functionality will be implemented in the next phase.",
    });
  };
  
  const handleExport = () => {
    toast({
      title: "Export Data",
      description: "The export functionality will be implemented in the next phase.",
    });
  };
  
  const handleRefreshData = () => {
    setRefreshing(true);
    
    // Simulate a data refresh
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "The reconciliation data has been refreshed.",
      });
    }, 1000);
  };
  
  const handleReconcileSingle = (transactionId: string) => {
    toast({
      title: "Transaction Reconciled",
      description: `Transaction ${transactionId} has been reconciled.`,
    });
    
    // In a real app, this would update the specific transaction in the database
  };
  
  // Sample transaction data for reconciliation
  const transactions = [
    { id: 'TX001', date: '2023-06-15', description: 'Fuel Purchase - Truck ABC123', amount: 5200, status: 'unreconciled' },
    { id: 'TX002', date: '2023-06-16', description: 'Payment - Global Logistics', amount: 8750, status: 'unreconciled' },
    { id: 'TX003', date: '2023-06-18', description: 'Service Fee', amount: 1200, status: 'reconciled' },
    { id: 'TX004', date: '2023-06-20', description: 'Fuel Purchase - Truck XYZ789', amount: 4800, status: 'unreconciled' },
    { id: 'TX005', date: '2023-06-22', description: 'Customer Payment - Acme Corp', amount: 12500, status: 'unreconciled' },
    { id: 'TX006', date: '2023-06-25', description: 'Bank Charges', amount: 350, status: 'reconciled' },
  ];
  
  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <AccountingPageLayout 
      title="Reconciliation" 
      description="Reconcile transactions with bank statements and other records."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle>Transaction Reconciliation</CardTitle>
                <CardDescription>
                  Match and reconcile transactions with external records
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleImportStatement}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleReconcile} disabled={selectedTransactions.length === 0}>
                  <Check className="h-4 w-4 mr-2" />
                  Reconcile
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Reconciliation Type</label>
                <Select value={reconciliationType} onValueChange={setReconciliationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Reconciliation</SelectItem>
                    <SelectItem value="cash">Cash Reconciliation</SelectItem>
                    <SelectItem value="inventory">Inventory Reconciliation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">From Date</label>
                <DatePicker date={fromDate} setDate={setFromDate} />
              </div>
              
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">To Date</label>
                <DatePicker date={toDate} setDate={setToDate} />
              </div>
              
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedTransactions.length === filteredTransactions.filter(t => t.status !== 'reconciled').length && filteredTransactions.filter(t => t.status !== 'reconciled').length > 0}
                          onCheckedChange={handleSelectAllChange}
                        />
                      </TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedTransactions.includes(transaction.id)}
                            onCheckedChange={(checked) => handleTransactionSelect(transaction.id, checked)}
                            disabled={transaction.status === 'reconciled'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            transaction.status === 'reconciled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={transaction.status === 'reconciled'}
                            onClick={() => handleReconcileSingle(transaction.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Reconcile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{transactions.filter(t => t.status === 'reconciled').length}</span> of {transactions.length} transactions reconciled
            </div>
            <Button variant="outline" onClick={handleRefreshData} disabled={refreshing}>
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Summary</CardTitle>
              <CardDescription>Current reconciliation status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">System Balance</div>
                    <div className="text-2xl font-bold mt-1">₹124,850.00</div>
                  </div>
                  <div className="p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">Bank Balance</div>
                    <div className="text-2xl font-bold mt-1">₹123,500.00</div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div className="text-sm font-medium">Difference</div>
                  </div>
                  <div className="text-xl font-bold mt-1 text-yellow-600">₹1,350.00</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Progress</CardTitle>
              <CardDescription>Progress towards complete reconciliation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bank Reconciliation</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '68%' }}></div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm">Cash Reconciliation</span>
                  <span className="text-sm font-medium">92%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm">Inventory Reconciliation</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AccountingPageLayout>
  );
};

export default Reconciliation;
