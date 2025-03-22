
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { BarChart, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ReportGenerationForm } from '@/components/accounting/reports/ReportGenerationForm';
import { RecentReportsList } from '@/components/accounting/reports/RecentReportsList';
import { ReportDisplay } from '@/components/accounting/reports/ReportDisplay';
import { 
  ReportData,
  getReportTypeLabel,
  getReportIcon,
  generateProfitLossReport,
  generateSalesReport,
  generateBalanceSheetReport,
  generateCashFlowReport,
  generateTaxSummaryReport,
  exportReportToCsv,
  printReport
} from '@/utils/reportUtils';

interface ExtendedRecentReport {
  type: string;
  date: Date;
  icon: React.ReactNode;
  data?: ReportData;
}

const FinancialReports = () => {
  const [reportType, setReportType] = useState<string>('profit-loss');
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [recentReports, setRecentReports] = useState<ExtendedRecentReport[]>([
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
      
      let data: ReportData;
      
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
      const newReport: ExtendedRecentReport = {
        type: getReportTypeLabel(reportType),
        date: new Date(),
        icon: getReportIcon(reportType),
        data: data // Store the report data for printing recent reports
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
  
  const handleExportReport = () => {
    if (!reportData) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first before exporting.",
        variant: "destructive"
      });
      return;
    }
    
    const success = exportReportToCsv(reportData);
    
    if (success) {
      toast({
        title: "Report Exported",
        description: "Your report has been downloaded as a CSV file."
      });
    } else {
      toast({
        title: "Export Failed",
        description: "There was a problem exporting the report. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handlePrintRecent = () => {
    if (recentReports.length > 0 && recentReports[0].data) {
      printReport(recentReports[0].data);
    } else {
      toast({
        title: "No Report Data",
        description: "No report data available to print.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AccountingPageLayout 
      title="Financial Reports" 
      description="Generate and download financial reports for accounting purposes."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <ReportGenerationForm
          reportType={reportType}
          setReportType={setReportType}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          isGenerating={isGenerating}
          onGenerateReport={handleGenerateReport}
        />
        
        <RecentReportsList
          reports={recentReports}
          onExportReport={handleExportReport}
        />
      </div>
      
      {reportData && (
        <ReportDisplay
          reportData={reportData}
          onExportReport={handleExportReport}
        />
      )}
    </AccountingPageLayout>
  );
};

export default FinancialReports;
