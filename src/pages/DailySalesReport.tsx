
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from '@/hooks/use-toast';
import DateRangeFilter from '@/components/shared/DateRangeFilter';
import { useDailySalesReport } from '@/hooks/useDailySalesReport';
import SummaryCards from '@/components/daily-sales-report/SummaryCards';
import SalesChart from '@/components/daily-sales-report/SalesChart';
import SalesDetailsTable from '@/components/daily-sales-report/SalesDetailsTable';
import StaffPerformanceTable from '@/components/daily-sales-report/StaffPerformanceTable';
import PaymentMethodsTable from '@/components/daily-sales-report/PaymentMethodsTable';

const DailySalesReport = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const {
    isLoading,
    salesData,
    staffData,
    paymentMethodData,
    totalSales,
    totalQuantity,
    chartData
  } = useDailySalesReport(dateRange);

  const handleExportReport = () => {
    if (salesData.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export",
        variant: "destructive"
      });
      return;
    }
    
    let csvContent = "date,totalSales,totalQuantity\n";
    
    salesData.forEach(data => {
      csvContent += `${data.date},${data.totalSales},${data.totalQuantity}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "The sales report has been exported successfully",
    });
  };

  const transactionCount = salesData.reduce((acc, day) => 
    acc + Object.keys(day.fuelTypes).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daily Sales Report</h1>
          <p className="text-muted-foreground">View and analyze daily sales data</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-[260px]"
          />
          
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={salesData.length === 0}
          >
            Export Report
          </Button>
        </div>
      </div>
      
      <SummaryCards
        totalSales={totalSales}
        totalQuantity={totalQuantity}
        transactionCount={transactionCount}
        dateRange={dateRange}
      />
      
      <Tabs defaultValue="sales-chart" className="w-full">
        <TabsList>
          <TabsTrigger value="sales-chart">Sales Chart</TabsTrigger>
          <TabsTrigger value="staff-performance">Staff Performance</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales-chart" className="space-y-4">
          <SalesChart chartData={chartData} isLoading={isLoading} />
          <SalesDetailsTable salesData={salesData} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="staff-performance">
          <StaffPerformanceTable 
            staffData={staffData} 
            totalSales={totalSales} 
            isLoading={isLoading} 
          />
        </TabsContent>
        
        <TabsContent value="payment-methods">
          <PaymentMethodsTable 
            paymentMethodData={paymentMethodData} 
            isLoading={isLoading} 
          />
        </TabsContent>
      </Tabs>
      
      <div className="text-sm text-muted-foreground mt-4">
        <p>* Reports are based on transaction data stored in the system.</p>
        <p>* For more comprehensive reporting options, visit the Financial Reports section.</p>
      </div>
    </div>
  );
};

export default DailySalesReport;
