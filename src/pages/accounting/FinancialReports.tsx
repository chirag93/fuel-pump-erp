
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { BarChart, FileText, Download, Printer, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReportData {
  title: string;
  date: string;
  summary: {
    label: string;
    value: string;
  }[];
  details?: any[];
}

const FinancialReports = () => {
  const [reportType, setReportType] = useState<string>('profit-loss');
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [recentReports, setRecentReports] = useState<{type: string; date: Date; icon: React.ReactNode}[]>([
    { type: 'Profit & Loss', date: new Date(Date.now() - 86400000 * 2), icon: <BarChart size={16} /> },
    { type: 'Balance Sheet', date: new Date(Date.now() - 86400000 * 5), icon: <FileText size={16} /> },
    { type: 'Sales Report', date: new Date(Date.now() - 86400000 * 10), icon: <BarChart size={16} /> },
  ]);
  
  const handleGenerateReport = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both from and to dates.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Format dates for the query
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      
      let data: ReportData = {
        title: '',
        date: `${format(fromDate, 'dd/MM/yyyy')} - ${format(toDate, 'dd/MM/yyyy')}`,
        summary: []
      };
      
      switch (reportType) {
        case 'profit-loss':
          data = await generateProfitLossReport(fromDateStr, toDateStr);
          break;
        case 'balance-sheet':
          data = await generateBalanceSheetReport(fromDateStr, toDateStr);
          break;
        case 'cash-flow':
          data = await generateCashFlowReport(fromDateStr, toDateStr);
          break;
        case 'tax-summary':
          data = await generateTaxSummaryReport(fromDateStr, toDateStr);
          break;
        case 'sales-report':
          data = await generateSalesReport(fromDateStr, toDateStr);
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      setReportData(data);
      
      // Add to recent reports
      const newReport = {
        type: getReportTypeLabel(reportType),
        date: new Date(),
        icon: getReportIcon(reportType)
      };
      
      setRecentReports([newReport, ...recentReports.slice(0, 2)]);
      
      toast({
        title: "Report Generated",
        description: `Your ${getReportTypeLabel(reportType)} report has been generated successfully.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: "There was a problem generating the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const getReportTypeLabel = (type: string): string => {
    switch (type) {
      case 'profit-loss': return 'Profit & Loss Statement';
      case 'balance-sheet': return 'Balance Sheet';
      case 'cash-flow': return 'Cash Flow Statement';
      case 'tax-summary': return 'Tax Summary';
      case 'sales-report': return 'Sales Report';
      default: return 'Report';
    }
  };
  
  const getReportIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'profit-loss':
      case 'sales-report':
      case 'cash-flow':
        return <BarChart size={16} />;
      default:
        return <FileText size={16} />;
    }
  };
  
  const generateProfitLossReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
    // Get all sales (revenue)
    const { data: sales, error: salesError } = await supabase
      .from('transactions')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (salesError) throw salesError;
    
    // Get all fuel purchases (cost of goods sold)
    const { data: purchases, error: purchasesError } = await supabase
      .from('tank_unloads')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (purchasesError) throw purchasesError;
    
    // Get all expenses (operating expenses)
    const { data: expenses, error: expensesError } = await supabase
      .from('consumables')
      .select('total_price')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (expensesError) throw expensesError;
    
    // Calculate totals
    const totalSales = sales ? sales.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    const totalExpenses = expenses ? expenses.reduce((sum, item) => sum + Number(item.total_price), 0) : 0;
    
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;
    
    return {
      title: 'Profit & Loss Statement',
      date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
      summary: [
        { label: 'Total Revenue', value: `₹${totalSales.toLocaleString('en-IN')}` },
        { label: 'Cost of Goods Sold', value: `₹${totalPurchases.toLocaleString('en-IN')}` },
        { label: 'Gross Profit', value: `₹${grossProfit.toLocaleString('en-IN')}` },
        { label: 'Operating Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}` },
        { label: 'Net Profit', value: `₹${netProfit.toLocaleString('en-IN')}` },
      ]
    };
  };
  
  const generateSalesReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
    // Get all sales transactions with fuel type
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        quantity,
        fuel_type,
        date,
        payment_method,
        customer_id,
        customers(name)
      `)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Group sales by fuel type
    const salesByFuelType: Record<string, number> = {};
    const salesByPaymentMethod: Record<string, number> = {};
    let totalSales = 0;
    let totalQuantity = 0;
    
    data?.forEach(transaction => {
      const amount = Number(transaction.amount) || 0;
      const quantity = Number(transaction.quantity) || 0;
      const fuelType = transaction.fuel_type || 'Unknown';
      const paymentMethod = transaction.payment_method || 'Unknown';
      
      salesByFuelType[fuelType] = (salesByFuelType[fuelType] || 0) + amount;
      salesByPaymentMethod[paymentMethod] = (salesByPaymentMethod[paymentMethod] || 0) + amount;
      
      totalSales += amount;
      totalQuantity += quantity;
    });
    
    // Prepare report data
    const summaryItems = [
      { label: 'Total Sales', value: `₹${totalSales.toLocaleString('en-IN')}` },
      { label: 'Total Quantity', value: `${totalQuantity.toLocaleString('en-IN')} liters` },
    ];
    
    // Add fuel type breakdown
    Object.entries(salesByFuelType).forEach(([fuelType, amount]) => {
      summaryItems.push({
        label: `${fuelType} Sales`,
        value: `₹${amount.toLocaleString('en-IN')}`
      });
    });
    
    // Add payment method breakdown
    Object.entries(salesByPaymentMethod).forEach(([method, amount]) => {
      summaryItems.push({
        label: `${method} Payments`,
        value: `₹${amount.toLocaleString('en-IN')}`
      });
    });
    
    return {
      title: 'Sales Report',
      date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
      summary: summaryItems,
      details: data?.map(transaction => ({
        id: transaction.id,
        date: format(new Date(transaction.date), 'dd/MM/yyyy'),
        customerName: transaction.customers?.name || 'Walk-in Customer',
        fuelType: transaction.fuel_type,
        quantity: `${Number(transaction.quantity).toLocaleString('en-IN')} L`,
        amount: `₹${Number(transaction.amount).toLocaleString('en-IN')}`,
        paymentMethod: transaction.payment_method
      }))
    };
  };
  
  const generateBalanceSheetReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
    // Get customer balances (accounts receivable)
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('balance');
    
    if (customersError) throw customersError;
    
    // Get current fuel inventory value
    const { data: fuelSettings, error: fuelError } = await supabase
      .from('fuel_settings')
      .select('fuel_type, current_level, current_price');
    
    if (fuelError) throw fuelError;
    
    // Calculate totals
    const accountsReceivable = customers ? customers.reduce((sum, customer) => sum + (Number(customer.balance) || 0), 0) : 0;
    
    let inventoryValue = 0;
    fuelSettings?.forEach(fuel => {
      const level = Number(fuel.current_level) || 0;
      const price = Number(fuel.current_price) || 0;
      inventoryValue += level * price;
    });
    
    // For demonstration purposes, using some fixed values for other assets and liabilities
    const cashAndBank = 250000; // Example fixed value
    const fixtures = 1500000; // Example fixed value
    const accountsPayable = 175000; // Example fixed value
    const loans = 500000; // Example fixed value
    
    const totalAssets = cashAndBank + accountsReceivable + inventoryValue + fixtures;
    const totalLiabilities = accountsPayable + loans;
    const equity = totalAssets - totalLiabilities;
    
    return {
      title: 'Balance Sheet',
      date: `As of ${format(new Date(toDate), 'dd/MM/yyyy')}`,
      summary: [
        { label: 'Assets', value: '' },
        { label: 'Cash and Bank', value: `₹${cashAndBank.toLocaleString('en-IN')}` },
        { label: 'Accounts Receivable', value: `₹${accountsReceivable.toLocaleString('en-IN')}` },
        { label: 'Inventory', value: `₹${inventoryValue.toLocaleString('en-IN')}` },
        { label: 'Fixtures and Equipment', value: `₹${fixtures.toLocaleString('en-IN')}` },
        { label: 'Total Assets', value: `₹${totalAssets.toLocaleString('en-IN')}` },
        { label: 'Liabilities', value: '' },
        { label: 'Accounts Payable', value: `₹${accountsPayable.toLocaleString('en-IN')}` },
        { label: 'Loans', value: `₹${loans.toLocaleString('en-IN')}` },
        { label: 'Total Liabilities', value: `₹${totalLiabilities.toLocaleString('en-IN')}` },
        { label: 'Equity', value: `₹${equity.toLocaleString('en-IN')}` },
      ]
    };
  };
  
  const generateCashFlowReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
    // Get cash sales
    const { data: cashSales, error: cashError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('payment_method', 'cash')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (cashError) throw cashError;
    
    // Get customer payments (cash inflow)
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (paymentsError) throw paymentsError;
    
    // Get fuel purchases (cash outflow)
    const { data: purchases, error: purchasesError } = await supabase
      .from('tank_unloads')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (purchasesError) throw purchasesError;
    
    // Get expenses (cash outflow)
    const { data: expenses, error: expensesError } = await supabase
      .from('consumables')
      .select('total_price')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (expensesError) throw expensesError;
    
    // Calculate totals
    const totalCashSales = cashSales ? cashSales.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    const totalPayments = payments ? payments.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    const totalExpenses = expenses ? expenses.reduce((sum, item) => sum + Number(item.total_price), 0) : 0;
    
    const totalCashInflow = totalCashSales + totalPayments;
    const totalCashOutflow = totalPurchases + totalExpenses;
    const netCashFlow = totalCashInflow - totalCashOutflow;
    
    return {
      title: 'Cash Flow Statement',
      date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
      summary: [
        { label: 'Cash Inflow', value: '' },
        { label: 'Cash Sales', value: `₹${totalCashSales.toLocaleString('en-IN')}` },
        { label: 'Customer Payments', value: `₹${totalPayments.toLocaleString('en-IN')}` },
        { label: 'Total Cash Inflow', value: `₹${totalCashInflow.toLocaleString('en-IN')}` },
        { label: 'Cash Outflow', value: '' },
        { label: 'Fuel Purchases', value: `₹${totalPurchases.toLocaleString('en-IN')}` },
        { label: 'Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}` },
        { label: 'Total Cash Outflow', value: `₹${totalCashOutflow.toLocaleString('en-IN')}` },
        { label: 'Net Cash Flow', value: `₹${netCashFlow.toLocaleString('en-IN')}` },
      ]
    };
  };
  
  const generateTaxSummaryReport = async (fromDate: string, toDate: string): Promise<ReportData> => {
    // Get all sales (for output tax calculation)
    const { data: sales, error: salesError } = await supabase
      .from('transactions')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (salesError) throw salesError;
    
    // Get all purchases (for input tax calculation)
    const { data: purchases, error: purchasesError } = await supabase
      .from('tank_unloads')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate);
    
    if (purchasesError) throw purchasesError;
    
    // Calculate tax amounts (assuming 18% GST for this example)
    const gstRate = 0.18;
    
    const totalSales = sales ? sales.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    const totalPurchases = purchases ? purchases.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
    
    const salesBeforeTax = totalSales / (1 + gstRate);
    const outputGST = totalSales - salesBeforeTax;
    
    const purchasesBeforeTax = totalPurchases / (1 + gstRate);
    const inputGST = totalPurchases - purchasesBeforeTax;
    
    const netGSTPayable = outputGST - inputGST;
    
    return {
      title: 'Tax Summary',
      date: `${format(new Date(fromDate), 'dd/MM/yyyy')} - ${format(new Date(toDate), 'dd/MM/yyyy')}`,
      summary: [
        { label: 'Output Tax', value: '' },
        { label: 'Taxable Sales', value: `₹${salesBeforeTax.toLocaleString('en-IN')}` },
        { label: 'Output GST', value: `₹${outputGST.toLocaleString('en-IN')}` },
        { label: 'Input Tax', value: '' },
        { label: 'Taxable Purchases', value: `₹${purchasesBeforeTax.toLocaleString('en-IN')}` },
        { label: 'Input GST', value: `₹${inputGST.toLocaleString('en-IN')}` },
        { label: 'Net GST Payable', value: `₹${netGSTPayable.toLocaleString('en-IN')}` },
      ]
    };
  };
  
  const handleExportReport = () => {
    if (!reportData) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first before exporting.",
        variant: "destructive"
      });
      return;
    }
    
    // Create CSV content
    const headers = "Category,Value\n";
    const rows = reportData.summary
      .filter(item => item.value) // Skip headers with empty values
      .map(item => `"${item.label}","${item.value}"`)
      .join('\n');
    
    const csvContent = `${headers}${rows}`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Your report has been downloaded as a CSV file."
    });
  };
  
  return (
    <AccountingPageLayout 
      title="Financial Reports" 
      description="Generate and download financial reports for accounting purposes."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Select report type and date range to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss Statement</SelectItem>
                  <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                  <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                  <SelectItem value="tax-summary">Tax Summary</SelectItem>
                  <SelectItem value="sales-report">Sales Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <DatePicker date={fromDate} setDate={setFromDate} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <DatePicker date={toDate} setDate={setToDate} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating || !fromDate || !toDate}
              className="w-full"
            >
              {isGenerating ? 
                "Generating..." : 
                "Generate Report"
              }
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Your recently generated reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {recentReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">{report.icon}</div>
                    <div>
                      <h4 className="text-sm font-medium">{report.type}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(report.date, 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={handleExportReport}>
                      <Download size={16} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Printer size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {reportData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{reportData.title}</CardTitle>
            <CardDescription>{reportData.date}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.summary.map((item, index) => (
                      <TableRow key={index} className={item.value === '' ? 'bg-muted/50 font-semibold' : ''}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell className="text-right">{item.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {reportData.details && reportData.details.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Detailed Transactions</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.details.slice(0, 10).map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>{detail.date}</TableCell>
                            <TableCell>{detail.customerName}</TableCell>
                            <TableCell>{detail.fuelType}</TableCell>
                            <TableCell>{detail.quantity}</TableCell>
                            <TableCell className="text-right">{detail.amount}</TableCell>
                          </TableRow>
                        ))}
                        {reportData.details.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                              <Button variant="link" className="gap-1">
                                View all {reportData.details.length} transactions
                                <ChevronRight size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleExportReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
                <Button>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </AccountingPageLayout>
  );
};

export default FinancialReports;
