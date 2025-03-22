
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface ReportGenerationFormProps {
  reportType: string;
  setReportType: (value: string) => void;
  fromDate: Date | undefined;
  setFromDate: (date: Date | undefined) => void;
  toDate: Date | undefined;
  setToDate: (date: Date | undefined) => void;
  isGenerating: boolean;
  onGenerateReport: () => void;
}

export const ReportGenerationForm: React.FC<ReportGenerationFormProps> = ({
  reportType,
  setReportType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  isGenerating,
  onGenerateReport
}) => {
  return (
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
          onClick={onGenerateReport} 
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
  );
};
