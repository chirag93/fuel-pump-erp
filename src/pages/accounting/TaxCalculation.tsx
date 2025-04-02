
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/hooks/use-toast';
import { Calculator, DownloadCloud, Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getFuelPumpId } from '@/integrations/utils';

const TaxCalculation = () => {
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [taxType, setTaxType] = useState<string>('gstr1');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);
  
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
      // Get fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate tax reports",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }
      
      // Format dates for the query
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      
      let data;
      let summary = {
        totalTaxableSales: 0,
        outputCGST: 0,
        outputSGST: 0,
        inputTaxCredit: 0,
        netGSTPayable: 0
      };
      
      // Fetch transactions based on the type of report and fuel pump ID
      if (taxType === 'gstr1') {
        // GSTR-1 is for outward supplies (sales)
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select(`
            id,
            amount,
            quantity,
            fuel_type,
            date,
            payment_method,
            discount_amount
          `)
          .eq('fuel_pump_id', fuelPumpId)
          .gte('date', fromDateStr)
          .lte('date', toDateStr);
        
        if (error) throw error;
        data = transactions;
        
        // Calculate GST (assuming 18% GST for fuel transactions)
        const gstRate = 0.18;
        
        // Process transactions to calculate totals
        if (data && data.length > 0) {
          let totalSales = 0;
          
          data.forEach((transaction: any) => {
            const amount = Number(transaction.amount) || 0;
            totalSales += amount;
          });
          
          // Calculate GST components
          const baseAmount = totalSales / (1 + gstRate);
          const totalGST = totalSales - baseAmount;
          
          summary = {
            totalTaxableSales: parseFloat(baseAmount.toFixed(2)),
            outputCGST: parseFloat((totalGST / 2).toFixed(2)),
            outputSGST: parseFloat((totalGST / 2).toFixed(2)),
            inputTaxCredit: 8750.00, // Example fixed value for now
            netGSTPayable: parseFloat((totalGST - 8750.00).toFixed(2))
          };
          
          setReportData(summary);
        }
      } else if (taxType === 'gstr2') {
        // GSTR-2 is for inward supplies (purchases)
        const { data: purchases, error } = await supabase
          .from('tank_unloads')
          .select('*')
          .eq('fuel_pump_id', fuelPumpId)
          .gte('date', fromDateStr)
          .lte('date', toDateStr);
        
        if (error) throw error;
        data = purchases;
        
        // This is simplified - in real world would need more complex calculation
        if (data && data.length > 0) {
          let totalPurchases = 0;
          
          data.forEach((purchase: any) => {
            const amount = Number(purchase.amount) || 0;
            totalPurchases += amount;
          });
          
          // Assuming 18% GST on purchases
          const gstRate = 0.18;
          const baseAmount = totalPurchases / (1 + gstRate);
          const totalInputGST = totalPurchases - baseAmount;
          
          summary = {
            totalTaxableSales: 125680.00, // Example fixed values
            outputCGST: 11311.20,
            outputSGST: 11311.20,
            inputTaxCredit: parseFloat(totalInputGST.toFixed(2)),
            netGSTPayable: parseFloat((22622.40 - totalInputGST).toFixed(2))
          };
          
          setReportData(summary);
        }
      } else if (taxType === 'gstr3b') {
        // GSTR-3B is a summary return
        // For demo we'll generate example data based on both sales and purchases
        
        // Get sales data
        const { data: salesData, error: salesError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('fuel_pump_id', fuelPumpId)
          .gte('date', fromDateStr)
          .lte('date', toDateStr);
          
        if (salesError) throw salesError;
        
        // Get purchase data
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('tank_unloads')
          .select('amount')
          .eq('fuel_pump_id', fuelPumpId)
          .gte('date', fromDateStr)
          .lte('date', toDateStr);
          
        if (purchaseError) throw purchaseError;
        
        // Calculate summary based on real data
        const totalSales = (salesData || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalPurchases = (purchaseData || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        
        const gstRate = 0.18;
        const salesBaseAmount = totalSales / (1 + gstRate);
        const outputGST = totalSales - salesBaseAmount;
        
        const purchaseBaseAmount = totalPurchases / (1 + gstRate);
        const inputGST = totalPurchases - purchaseBaseAmount;
        
        summary = {
          totalTaxableSales: parseFloat(salesBaseAmount.toFixed(2)),
          outputCGST: parseFloat((outputGST / 2).toFixed(2)),
          outputSGST: parseFloat((outputGST / 2).toFixed(2)),
          inputTaxCredit: parseFloat(inputGST.toFixed(2)),
          netGSTPayable: parseFloat((outputGST - inputGST).toFixed(2))
        };
        
        setReportData(summary);
      }
      
      toast({
        title: "GST Report Generated",
        description: `Your ${taxType.toUpperCase()} report has been generated successfully.`,
      });
    } catch (error) {
      console.error("Error generating GST report:", error);
      toast({
        title: "Error Generating Report",
        description: "There was a problem generating the tax report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Helper function to download reports
  const handleExportReport = () => {
    if (!reportData) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first before exporting.",
        variant: "destructive"
      });
      return;
    }
    
    const reportPeriod = fromDate && toDate 
      ? `${format(fromDate, 'dd-MM-yyyy')}_to_${format(toDate, 'dd-MM-yyyy')}`
      : 'custom_period';
    
    // Create CSV content
    const headers = "Category,Amount (INR)\n";
    const rows = [
      `Taxable Sales,${reportData.totalTaxableSales}`,
      `Output CGST,${reportData.outputCGST}`,
      `Output SGST,${reportData.outputSGST}`,
      `Input Tax Credit,${reportData.inputTaxCredit}`,
      `Net GST Payable,${reportData.netGSTPayable}`
    ].join('\n');
    
    const csvContent = `${headers}${rows}`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Report_${taxType.toUpperCase()}_${reportPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Your GST report has been downloaded as a CSV file."
    });
  };
  
  // Function to handle viewing details button
  const handleViewDetails = () => {
    if (!reportData) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first to view details.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Detailed View",
      description: "Detailed view functionality will be implemented in the next phase.",
    });
  };
  
  return (
    <AccountingPageLayout 
      title="Tax Calculation" 
      description="Calculate taxes and generate tax reports for compliance."
    >
      <Tabs defaultValue="gst" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="tds">TDS</TabsTrigger>
          <TabsTrigger value="tax-planning">Plan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gst" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>GST Return Calculator</CardTitle>
                <CardDescription>
                  Generate GST reports for filing returns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Type</label>
                  <Select value={taxType} onValueChange={setTaxType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select return type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gstr1">GSTR-1 (Sales)</SelectItem>
                      <SelectItem value="gstr2">GSTR-2 (Purchases)</SelectItem>
                      <SelectItem value="gstr3b">GSTR-3B (Summary)</SelectItem>
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
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Generate GST Report
                    </>
                  }
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>GST Calculations Summary</CardTitle>
                <CardDescription>
                  {reportData && fromDate && toDate ? 
                    `${format(fromDate, 'dd/MM/yyyy')} - ${format(toDate, 'dd/MM/yyyy')}` : 
                    'Current quarter GST calculations'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Total Taxable Sales</span>
                    <span className="font-medium">₹{reportData ? reportData.totalTaxableSales.toLocaleString('en-IN') : '125,680.00'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Output CGST</span>
                    <span className="font-medium">₹{reportData ? reportData.outputCGST.toLocaleString('en-IN') : '11,311.20'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Output SGST</span>
                    <span className="font-medium">₹{reportData ? reportData.outputSGST.toLocaleString('en-IN') : '11,311.20'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm">Input Tax Credit</span>
                    <span className="font-medium">₹{reportData ? reportData.inputTaxCredit.toLocaleString('en-IN') : '8,750.00'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm font-medium">Net GST Payable</span>
                    <span className="font-medium">₹{reportData ? reportData.netGSTPayable.toLocaleString('en-IN') : '13,872.40'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="outline" onClick={handleViewDetails}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={handleExportReport}
                    disabled={!reportData}
                  >
                    <DownloadCloud className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TDS Calculation</CardTitle>
              <CardDescription>
                Calculate TDS for various payment types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tax-planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Planning</CardTitle>
              <CardDescription>
                Tools to help with tax planning and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This section will be implemented in the next phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AccountingPageLayout>
  );
};

export default TaxCalculation;
