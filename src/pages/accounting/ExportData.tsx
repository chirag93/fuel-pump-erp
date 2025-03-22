
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { DownloadCloud, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ExportData = () => {
  const [dataType, setDataType] = useState<string>('transactions');
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [fileFormat, setFileFormat] = useState<string>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const dataTypes = [
    { value: 'transactions', label: 'Transactions' },
    { value: 'customers', label: 'Customers' },
    { value: 'payments', label: 'Payments' },
    { value: 'indents', label: 'Indents' },
    { value: 'stock', label: 'Stock' },
    { value: 'vehicles', label: 'Vehicles' },
  ];
  
  const fileFormats = [
    { value: 'csv', label: 'CSV', icon: <FileText size={16} /> },
    { value: 'excel', label: 'Excel', icon: <FileSpreadsheet size={16} /> },
    { value: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  ];
  
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export delay
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Data Exported",
        description: `Your ${dataType} data has been exported as ${fileFormat.toUpperCase()}.`,
      });
    }, 1500);
  };
  
  return (
    <AccountingPageLayout 
      title="Export Data" 
      description="Export accounting data in various formats for external use."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>
              Export data to CSV, Excel or PDF format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Type</label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">File Format</label>
              <div className="flex gap-4 mt-2">
                {fileFormats.map((format) => (
                  <div key={format.value} className="flex items-center gap-2">
                    <Checkbox
                      id={format.value}
                      checked={fileFormat === format.value}
                      onCheckedChange={() => setFileFormat(format.value)}
                    />
                    <label htmlFor={format.value} className="flex items-center text-sm gap-1 cursor-pointer">
                      {format.icon}
                      {format.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || !fromDate || !toDate}
              className="w-full"
            >
              {isExporting ? 
                "Exporting..." : 
                <>
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  Export Data
                </>
              }
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Export Templates</CardTitle>
            <CardDescription>
              Pre-configured export templates for common scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {[
                { 
                  name: 'Monthly Transactions', 
                  description: 'All transactions for the current month',
                  format: 'Excel'
                },
                { 
                  name: 'Customer Balances', 
                  description: 'Current balances for all customers',
                  format: 'CSV'
                },
                { 
                  name: 'Tally Import File', 
                  description: 'Format compatible with Tally ERP',
                  format: 'XML'
                },
                { 
                  name: 'GST Report', 
                  description: 'Formatted report for GST filing',
                  format: 'Excel'
                },
              ].map((template, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <h4 className="text-sm font-medium">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <DownloadCloud className="w-4 h-4 mr-1" />
                    {template.format}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AccountingPageLayout>
  );
};

export default ExportData;
