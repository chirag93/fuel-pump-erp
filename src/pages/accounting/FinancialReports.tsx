
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { BarChart, FileText, Download, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const FinancialReports = () => {
  const [reportType, setReportType] = useState<string>('profit-loss');
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been generated successfully.`,
      });
    }, 1500);
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
              {[
                { type: 'Profit & Loss', date: new Date(Date.now() - 86400000 * 2), icon: <BarChart size={16} /> },
                { type: 'Balance Sheet', date: new Date(Date.now() - 86400000 * 5), icon: <FileText size={16} /> },
                { type: 'Sales Report', date: new Date(Date.now() - 86400000 * 10), icon: <BarChart size={16} /> },
              ].map((report, index) => (
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
                    <Button variant="ghost" size="icon">
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
    </AccountingPageLayout>
  );
};

export default FinancialReports;
