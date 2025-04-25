
import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';
import { toast } from '@/hooks/use-toast';

export const useDailySalesReport = (dateRange: DateRange) => {
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchReportData();
    }
  }, [dateRange]);

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
        .not('fuel_type', 'eq', 'PAYMENT');
      
      if (error) throw error;
      
      processTransactionData(transactions || []);
      
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

  const processTransactionData = (transactions: any[]) => {
    if (!transactions || transactions.length === 0) {
      setSalesData([]);
      setStaffData([]);
      setPaymentMethodData([]);
      setTotalSales(0);
      setTotalQuantity(0);
      return;
    }

    // Process sales data by date
    const salesByDate: Record<string, any> = {};
    let totalSalesAmount = 0;
    let totalQuantityAmount = 0;
    
    // Process staff performance data
    const staffSales: Record<string, any> = {};
    
    // Process payment methods data
    const paymentMethods: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const { date, amount, quantity, fuel_type, staff_id, staff, payment_method } = tx;
      const numAmount = Number(amount) || 0;
      const numQuantity = Number(quantity) || 0;
      
      totalSalesAmount += numAmount;
      totalQuantityAmount += numQuantity;
      
      // Update sales by date
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          totalSales: 0,
          totalQuantity: 0,
          fuelTypes: {}
        };
      }
      
      salesByDate[date].totalSales += numAmount;
      salesByDate[date].totalQuantity += numQuantity;
      
      if (!salesByDate[date].fuelTypes[fuel_type]) {
        salesByDate[date].fuelTypes[fuel_type] = { sales: 0, quantity: 0 };
      }
      
      salesByDate[date].fuelTypes[fuel_type].sales += numAmount;
      salesByDate[date].fuelTypes[fuel_type].quantity += numQuantity;
      
      // Update staff performance data
      if (!staffSales[staff_id]) {
        staffSales[staff_id] = {
          staffName: staff?.name || 'Unknown Staff',
          id: staff_id,
          totalSales: 0,
          transactionCount: 0
        };
      }
      
      staffSales[staff_id].totalSales += numAmount;
      staffSales[staff_id].transactionCount++;
      
      // Update payment methods data
      if (!paymentMethods[payment_method]) {
        paymentMethods[payment_method] = 0;
      }
      
      paymentMethods[payment_method] += numAmount;
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
    
    // Update state
    setSalesData(salesDataArray);
    setStaffData(staffDataArray);
    setPaymentMethodData(paymentMethodsArray);
    setTotalSales(totalSalesAmount);
    setTotalQuantity(totalQuantityAmount);
  };

  const chartData = salesData.map(data => ({
    name: format(new Date(data.date), 'dd MMM'),
    sales: data.totalSales
  }));

  return {
    isLoading,
    salesData,
    staffData,
    paymentMethodData,
    totalSales,
    totalQuantity,
    chartData
  };
};

