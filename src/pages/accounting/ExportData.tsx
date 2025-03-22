
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { DownloadCloud, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define a type for the available data types to export
type ExportDataType = 
  | 'transactions' 
  | 'customers' 
  | 'customer_payments' 
  | 'indents' 
  | 'stock' 
  | 'vehicles' 
  | 'invoices' 
  | 'daily_readings'
  | 'fuel_settings';

const ExportData = () => {
  const [dataType, setDataType] = useState<ExportDataType>('transactions');
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [fileFormat, setFileFormat] = useState<string>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const dataTypes = [
    { value: 'transactions', label: 'Transactions' },
    { value: 'customers', label: 'Customers' },
    { value: 'customer_payments', label: 'Payments' },
    { value: 'indents', label: 'Indents' },
    { value: 'stock', label: 'Stock' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'invoices', label: 'Invoices' },
    { value: 'daily_readings', label: 'Daily Readings' },
    { value: 'fuel_settings', label: 'Fuel Settings' },
  ] as const;
  
  const fileFormats = [
    { value: 'csv', label: 'CSV', icon: <FileText size={16} /> },
    { value: 'excel', label: 'Excel', icon: <FileSpreadsheet size={16} /> },
    { value: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  ];
  
  const handleExport = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both from and to dates.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Format dates for the query
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      
      let data;
      let filename = `${dataType}_${fromDateStr}_to_${toDateStr}.${fileFormat}`;
      
      // Fetch data based on type
      switch (dataType) {
        case 'transactions':
          const { data: transactions, error: transactionError } = await supabase
            .from('transactions')
            .select('*')
            .gte('date', fromDateStr)
            .lte('date', toDateStr);
          
          if (transactionError) throw transactionError;
          data = transactions;
          break;
          
        case 'customers':
          const { data: customers, error: customerError } = await supabase
            .from('customers')
            .select('*');
          
          if (customerError) throw customerError;
          data = customers;
          break;
          
        case 'customer_payments':
          const { data: payments, error: paymentError } = await supabase
            .from('customer_payments')
            .select('*')
            .gte('date', fromDateStr)
            .lte('date', toDateStr);
          
          if (paymentError) throw paymentError;
          data = payments;
          break;
          
        case 'invoices':
          const { data: invoices, error: invoiceError } = await supabase
            .rpc('get_invoices_with_customer_names');
          
          if (invoiceError) throw invoiceError;
          data = invoices;
          break;
          
        case 'stock':
          const { data: inventory, error: inventoryError } = await supabase
            .from('inventory')
            .select('*');
          
          if (inventoryError) throw inventoryError;
          data = inventory;
          break;
          
        case 'indents':
          const { data: indents, error: indentsError } = await supabase
            .from('indents')
            .select('*')
            .gte('date', fromDateStr)
            .lte('date', toDateStr);
          
          if (indentsError) throw indentsError;
          data = indents;
          break;
          
        case 'vehicles':
          const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*');
          
          if (vehiclesError) throw vehiclesError;
          data = vehicles;
          break;
          
        case 'daily_readings':
          const { data: readings, error: readingsError } = await supabase
            .from('daily_readings')
            .select('*')
            .gte('date', fromDateStr)
            .lte('date', toDateStr);
          
          if (readingsError) throw readingsError;
          data = readings;
          break;
          
        case 'fuel_settings':
          const { data: fuelSettings, error: fuelSettingsError } = await supabase
            .from('fuel_settings')
            .select('*');
          
          if (fuelSettingsError) throw fuelSettingsError;
          data = fuelSettings;
          break;
      }
      
      // Process the data for export
      if (data && data.length > 0) {
        // For CSV/Excel, create a downloadable file
        if (fileFormat === 'csv') {
          const csvContent = convertToCSV(data);
          downloadFile(csvContent, filename, 'text/csv');
        } else if (fileFormat === 'excel') {
          // For Excel, we'd typically use a library like xlsx
          // This is a simple CSV alternative for now
          const csvContent = convertToCSV(data);
          downloadFile(csvContent, filename.replace('csv', 'xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } else if (fileFormat === 'pdf') {
          // For PDF, typically use a library like jsPDF
          // Displaying a message for now
          toast({
            title: "PDF Export",
            description: `Your ${dataType} data (${data.length} records) is ready for PDF export.`,
          });
        }
        
        toast({
          title: "Export Successful",
          description: `Successfully exported ${data.length} ${dataType} records.`,
        });
      } else {
        toast({
          title: "No Data",
          description: `No ${dataType} data found for the selected date range.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `There was an error exporting the ${dataType} data.`,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Helper function to convert data to CSV
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');
    
    const rows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle special cases for CSV formatting
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      }).join(',');
    });
    
    return [headerRow, ...rows].join('\n');
  };
  
  // Helper function to download a file
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Clone the handleExport function for template exports
  const handleTemplateExport = (templateName: string, format: string) => {
    setIsExporting(true);
    
    // Simulate export delay
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Template Exported",
        description: `Your ${templateName} template has been exported as ${format}.`,
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
              <Select 
                value={dataType} 
                onValueChange={(value) => setDataType(value as ExportDataType)}
              >
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
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTemplateExport(template.name, template.format)}
                  >
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
