
import React, { useState, useEffect } from 'react';
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
import DateRangeFilter from '@/components/shared/DateRangeFilter';
import { format, subDays, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { 
  getReconciliationTransactions, 
  getReconciliationSummary, 
  getReconciliationProgress, 
  updateReconciliationStatus,
  ReconciliationTransaction, 
  ReconciliationSummary, 
  ReconciliationProgress 
} from '@/integrations/reconciliation';

const Reconciliation = () => {
  const [reconciliationType, setReconciliationType] = useState<string>('bank');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [transactions, setTransactions] = useState<ReconciliationTransaction[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    systemBalance: 0,
    bankBalance: 0,
    difference: 0
  });
  const [progress, setProgress] = useState<ReconciliationProgress>({
    bankReconciliation: 0,
    cashReconciliation: 0,
    inventoryReconciliation: 0
  });
  
  // Load initial data
  useEffect(() => {
    loadReconciliationData();
  }, []);
  
  // Refresh data when date range changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      loadTransactionData();
    }
  }, [dateRange]);
  
  const loadReconciliationData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadTransactionData(),
        loadSummaryData(),
        loadProgressData()
      ]);
    } catch (error) {
      console.error('Error loading reconciliation data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const loadTransactionData = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    const fromDate = format(dateRange.from, 'yyyy-MM-dd');
    const toDate = format(dateRange.to, 'yyyy-MM-dd');
    
    const data = await getReconciliationTransactions(fromDate, toDate, searchTerm);
    setTransactions(data);
  };
  
  const loadSummaryData = async () => {
    const data = await getReconciliationSummary();
    setSummary(data);
  };
  
  const loadProgressData = async () => {
    const data = await getReconciliationProgress();
    setProgress(data);
  };
  
  const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedTransactions(transactions
        .filter(t => t.status !== 'reconciled')
        .map(transaction => transaction.id)
      );
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
  
  const handleReconcile = async () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: "No Transactions Selected",
        description: "Please select at least one transaction to reconcile.",
        variant: "destructive"
      });
      return;
    }
    
    const success = await updateReconciliationStatus(selectedTransactions, 'reconciled');
    
    if (success) {
      toast({
        title: "Transactions Reconciled",
        description: `Successfully reconciled ${selectedTransactions.length} transactions.`,
      });
      
      // Update local state to reflect changes
      const updatedTransactions = transactions.map(transaction => {
        if (selectedTransactions.includes(transaction.id)) {
          return { ...transaction, status: 'reconciled' as const };
        }
        return transaction;
      });
      
      setTransactions(updatedTransactions);
      setSelectedTransactions([]);
      
      // Refresh summary data
      loadSummaryData();
      loadProgressData();
    }
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
    
    loadReconciliationData().finally(() => {
      setRefreshing(false);
      toast({
        title: "Data Refreshed",
        description: "The reconciliation data has been refreshed.",
      });
    });
  };
  
  const handleReconcileSingle = async (transactionId: string) => {
    const success = await updateReconciliationStatus([transactionId], 'reconciled');
    
    if (success) {
      toast({
        title: "Transaction Reconciled",
        description: `Transaction ${transactionId} has been reconciled.`,
      });
      
      // Update the specific transaction to show it as reconciled
      const updatedTransactions = transactions.map(transaction => {
        if (transaction.id === transactionId) {
          return { ...transaction, status: 'reconciled' as const };
        }
        return transaction;
      });
      
      setTransactions(updatedTransactions);
      
      // Refresh summary data
      loadSummaryData();
      loadProgressData();
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Apply search filter when the search term changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      loadTransactionData();
    }, 300);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);
  
  const reconciliationTypeOptions = [
    { value: 'bank', label: 'Bank Reconciliation' },
    { value: 'cash', label: 'Cash Reconciliation' },
    { value: 'inventory', label: 'Inventory Reconciliation' }
  ];
  
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  
  // Calculate the total number of reconciled transactions
  const reconciledCount = transactions.filter(t => t.status === 'reconciled').length;
  
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
                    {reconciliationTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Date Range</label>
                <DateRangeFilter 
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  className="w-full"
                />
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
                    onChange={handleSearchChange}
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
                          checked={
                            selectedTransactions.length === transactions.filter(t => t.status !== 'reconciled').length && 
                            transactions.filter(t => t.status !== 'reconciled').length > 0
                          }
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
                    {transactions.map((transaction) => (
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
                    {transactions.length === 0 && (
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
              <span className="font-medium">{reconciledCount}</span> of {transactions.length} transactions reconciled
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
                    <div className="text-2xl font-bold mt-1">₹{summary.systemBalance.toLocaleString()}</div>
                  </div>
                  <div className="p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">Bank Balance</div>
                    <div className="text-2xl font-bold mt-1">₹{summary.bankBalance.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div className="text-sm font-medium">Difference</div>
                  </div>
                  <div className="text-xl font-bold mt-1 text-yellow-600">₹{summary.difference.toLocaleString()}</div>
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
                  <span className="text-sm font-medium">{progress.bankReconciliation}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${progress.bankReconciliation}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm">Cash Reconciliation</span>
                  <span className="text-sm font-medium">{progress.cashReconciliation}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${progress.cashReconciliation}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm">Inventory Reconciliation</span>
                  <span className="text-sm font-medium">{progress.inventoryReconciliation}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${progress.inventoryReconciliation}%` }}
                  />
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
