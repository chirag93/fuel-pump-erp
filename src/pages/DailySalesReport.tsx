
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';
import { Bar as BarChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DateRangeFilter from '@/components/shared/DateRangeFilter';
import { formatDate } from '@/utils/dateUtils';

// Report types and interfaces
interface SalesReportData {
  date: string;
  totalSales: number;
  totalQuantity: number;
  fuelTypes: Record<string, { sales: number, quantity: number }>;
}

interface StaffPerformanceData {
  staffName: string;
  id: string;
  totalSales: number;
  transactionCount: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  percentage: number;
}

const DailySalesReport = () => {
  // State for date range filtering
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  
  // State for report data
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [salesData, setSalesData] = useState<SalesReportData[]>([]);
  const [staffData, setStaffData] = useState<StaffPerformanceData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodData[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  
  // Fetch report data when date range changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchReportData();
    }
  }, [dateRange]);
  
  // Function to fetch report data from the database
  const fetchReportData = async () => {
    setIsLoading(true);
    
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to access reports",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Format dates for database query
      const fromDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
      const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
      
      // Fetch transactions for the date range
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          fuel_type,
          amount,
          quantity,
          payment_method,
          staff_id,
          staff:staff_id(name)
        `)
        .eq('fuel_pump_id', fuelPumpId)
        .gte('date', fromDate)
        .lte('date', toDate)
        .not('fuel_type', 'eq', 'PAYMENT'); // Exclude payment transactions
      
      if (error) {
        throw error;
      }
      
      if (!transactions || transactions.length === 0) {
        setIsLoading(false);
        setSalesData([]);
        setStaffData([]);
        setPaymentMethodData([]);
        setTotalSales(0);
        setTotalQuantity(0);
        return;
      }
      
      // Process daily sales data
      const salesByDate: Record<string, SalesReportData> = {};
      let totalSalesAmount = 0;
      let totalQuantityAmount = 0;
      
      // Process staff performance data
      const staffSales: Record<string, StaffPerformanceData> = {};
      
      // Process payment methods data
      const paymentMethods: Record<string, number> = {};
      
      // Loop through transactions and aggregate data
      transactions.forEach(tx => {
        const date = tx.date;
        const amount = Number(tx.amount) || 0;
        const quantity = Number(tx.quantity) || 0;
        const fuelType = tx.fuel_type || 'Unknown';
        const staffId = tx.staff_id;
        const staffName = tx.staff?.name || 'Unknown Staff';
        const paymentMethod = tx.payment_method || 'Unknown';
        
        // Update total amounts
        totalSalesAmount += amount;
        totalQuantityAmount += quantity;
        
        // Update sales by date
        if (!salesByDate[date]) {
          salesByDate[date] = {
            date,
            totalSales: 0,
            totalQuantity: 0,
            fuelTypes: {}
          };
        }
        
        salesByDate[date].totalSales += amount;
        salesByDate[date].totalQuantity += quantity;
        
        if (!salesByDate[date].fuelTypes[fuelType]) {
          salesByDate[date].fuelTypes[fuelType] = { sales: 0, quantity: 0 };
        }
        
        salesByDate[date].fuelTypes[fuelType].sales += amount;
        salesByDate[date].fuelTypes[fuelType].quantity += quantity;
        
        // Update staff performance data
        if (!staffSales[staffId]) {
          staffSales[staffId] = {
            staffName,
            id: staffId,
            totalSales: 0,
            transactionCount: 0
          };
        }
        
        staffSales[staffId].totalSales += amount;
        staffSales[staffId].transactionCount++;
        
        // Update payment methods data
        if (!paymentMethods[paymentMethod]) {
          paymentMethods[paymentMethod] = 0;
        }
        
        paymentMethods[paymentMethod] += amount;
      });
      
      // Convert to arrays and sort
      const salesDataArray = Object.values(salesByDate).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const staffDataArray = Object.values(staffSales).sort((a, b) => 
        b.totalSales - a.totalSales
      );
      
      // Calculate payment method percentages
      const paymentMethodsArray = Object.entries(paymentMethods).map(([method, amount]) => ({
        method,
        amount,
        percentage: totalSalesAmount > 0 ? (amount / totalSalesAmount) * 100 : 0
      }));
      
      // Update state with processed data
      setSalesData(salesDataArray);
      setStaffData(staffDataArray);
      setPaymentMethodData(paymentMethodsArray);
      setTotalSales(totalSalesAmount);
      setTotalQuantity(totalQuantityAmount);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Prepare chart data for sales by date
  const chartData = salesData.map(data => ({
    name: formatDate(data.date),
    sales: data.totalSales
  }));
  
  // Handler for exporting report to CSV
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
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quantity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString('en-IN')} L</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.reduce((acc, day) => 
              acc + Object.keys(day.fuelTypes).length, 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {dateRange.from && dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                </>
              ) : (
                'Select date range'
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different report views */}
      <Tabs defaultValue="sales-chart" className="w-full">
        <TabsList>
          <TabsTrigger value="sales-chart">Sales Chart</TabsTrigger>
          <TabsTrigger value="staff-performance">Staff Performance</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>
        
        {/* Sales Chart Tab */}
        <TabsContent value="sales-chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading chart data...</p>
                </div>
              ) : salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <BarChart dataKey="sales" fill="#3B82F6" name="Sales (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>No sales data available for the selected date range</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading data...</p>
              ) : salesData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Sales (₹)</TableHead>
                        <TableHead>Total Quantity (L)</TableHead>
                        <TableHead>Fuel Types</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.map(data => (
                        <TableRow key={data.date}>
                          <TableCell>{formatDate(data.date)}</TableCell>
                          <TableCell>₹{data.totalSales.toLocaleString('en-IN')}</TableCell>
                          <TableCell>{data.totalQuantity.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {Object.entries(data.fuelTypes).map(([fuelType, { sales, quantity }]) => (
                                <div key={fuelType} className="text-xs">
                                  {fuelType}: {quantity.toLocaleString('en-IN')} L (₹{sales.toLocaleString('en-IN')})
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p>No sales data available for the selected date range</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Staff Performance Tab */}
        <TabsContent value="staff-performance">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading data...</p>
              ) : staffData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Total Sales (₹)</TableHead>
                        <TableHead>Transaction Count</TableHead>
                        <TableHead>Average Sale (₹)</TableHead>
                        <TableHead>Performance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffData.map(staff => (
                        <TableRow key={staff.id}>
                          <TableCell>{staff.staffName}</TableCell>
                          <TableCell>₹{staff.totalSales.toLocaleString('en-IN')}</TableCell>
                          <TableCell>{staff.transactionCount}</TableCell>
                          <TableCell>
                            ₹{(staff.totalSales / staff.transactionCount).toLocaleString('en-IN', { 
                              maximumFractionDigits: 2 
                            })}
                          </TableCell>
                          <TableCell>
                            {totalSales > 0 ? ((staff.totalSales / totalSales) * 100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p>No staff performance data available for the selected date range</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading data...</p>
              ) : paymentMethodData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Amount (₹)</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethodData.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>₹{payment.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell>{payment.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p>No payment method data available for the selected date range</p>
              )}
            </CardContent>
          </Card>
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
