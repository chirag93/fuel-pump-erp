import { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line, 
  LineChart,
  ResponsiveContainer
} from 'recharts';
import { ArrowUpCircle, DollarSign, Users, Droplets, TrendingUp, Fuel, Calendar, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getFuelPumpId } from '@/integrations/utils';
import { supabase } from '@/integrations/supabase/client';

// Cache keys for React Query
const QUERY_KEYS = {
  dashboardData: 'dashboardData',
  fuelPumpId: 'fuelPumpId',
  salesData: (startDate: Date, endDate: Date) => ['salesData', startDate.toISOString(), endDate.toISOString()],
  fuelVolume: (startDate: Date, endDate: Date) => ['fuelVolume', startDate.toISOString(), endDate.toISOString()],
  recentTransactions: 'recentTransactions',
  fuelLevels: 'fuelLevels',
  metrics: (startDate: Date, endDate: Date) => ['metrics', startDate.toISOString(), endDate.toISOString()],
  totalCredits: 'totalCredits'
};

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Date range state for filtering
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  // Get fuel pump ID once with React Query - this will be cached
  const { data: fuelPumpId } = useQuery({
    queryKey: [QUERY_KEYS.fuelPumpId],
    queryFn: getFuelPumpId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1
  });

  // Format date strings for API calls
  const formattedStartDate = useMemo(() => 
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : format(startOfMonth(new Date()), 'yyyy-MM-dd'), 
    [dateRange.from]
  );

  const formattedEndDate = useMemo(() => 
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    [dateRange.to]
  );

  // Query for total credits
  const { data: totalCredits = '₹0', isLoading: isLoadingCredits } = useQuery({
    queryKey: [QUERY_KEYS.totalCredits, fuelPumpId],
    queryFn: async () => {
      if (!fuelPumpId) return '₹0';
      
      const { data, error } = await supabase
        .from('customers')
        .select('balance')
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return '₹0';
      }
      
      // Sum all customer balances (debts are negative balances)
      const totalCredit = data.reduce((sum, customer) => {
        const balance = Number(customer.balance);
        return sum + (balance < 0 ? Math.abs(balance) : 0);
      }, 0);
      
      return `₹${totalCredit.toLocaleString()}`;
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Query for sales data with proper caching
  const { data: salesData = [], isLoading: isLoadingSales } = useQuery({
    queryKey: QUERY_KEYS.salesData(dateRange.from || startOfMonth(new Date()), dateRange.to || new Date()),
    queryFn: async () => {
      if (!fuelPumpId) return [];
      
      console.log(`Fetching sales data for date range: ${formattedStartDate} to ${formattedEndDate}`);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('date, amount, fuel_type')
        .eq('fuel_pump_id', fuelPumpId)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate)
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Group data by date
      const groupedByDate: Record<string, number> = {};
      
      data.forEach(transaction => {
        const dateStr = transaction.date;
        const formattedDate = format(new Date(dateStr), 'dd MMM');
        
        if (!groupedByDate[formattedDate]) {
          groupedByDate[formattedDate] = 0;
        }
        
        groupedByDate[formattedDate] += Number(transaction.amount) || 0;
      });
      
      // Convert to chart data format
      return Object.keys(groupedByDate).map(date => ({
        name: date,
        total: Math.round(groupedByDate[date])
      }));
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Query for fuel volume data with proper caching
  const { data: fuelData = [], isLoading: isLoadingFuel } = useQuery({
    queryKey: QUERY_KEYS.fuelVolume(dateRange.from || startOfMonth(new Date()), dateRange.to || new Date()),
    queryFn: async () => {
      if (!fuelPumpId) return [];
      
      const { data, error } = await supabase
        .from('daily_readings')
        .select('date, fuel_type, sales_per_tank_stock')
        .eq('fuel_pump_id', fuelPumpId)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate)
        .order('date', { ascending: true });
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Group data by date and fuel type
      const groupedByDate: Record<string, { petrol: number, diesel: number }> = {};
      
      data.forEach(reading => {
        if (!reading.sales_per_tank_stock) return;
        
        const dateStr = reading.date;
        const formattedDate = format(new Date(dateStr), 'dd MMM');
        
        if (!groupedByDate[formattedDate]) {
          groupedByDate[formattedDate] = { petrol: 0, diesel: 0 };
        }
        
        if (reading.fuel_type.toLowerCase().includes('petrol')) {
          groupedByDate[formattedDate].petrol += Number(reading.sales_per_tank_stock) || 0;
        } else if (reading.fuel_type.toLowerCase().includes('diesel')) {
          groupedByDate[formattedDate].diesel += Number(reading.sales_per_tank_stock) || 0;
        }
      });
      
      // Convert to chart data format
      return Object.keys(groupedByDate).map(date => ({
        name: date,
        petrol: Math.round(groupedByDate[date].petrol),
        diesel: Math.round(groupedByDate[date].diesel)
      }));
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Query for recent transactions with proper caching
  const { data: recentTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: [QUERY_KEYS.recentTransactions, fuelPumpId],
    queryFn: async () => {
      if (!fuelPumpId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, fuel_type, amount, created_at, quantity')
        .eq('fuel_pump_id', fuelPumpId)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Query for fuel levels with proper caching
  const { data: fuelLevels = {}, isLoading: isLoadingFuelLevels } = useQuery({
    queryKey: [QUERY_KEYS.fuelLevels, fuelPumpId],
    queryFn: async () => {
      if (!fuelPumpId) return {};
      
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('fuel_type, current_level, tank_capacity')
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) throw error;
      
      const fuelLevels: Record<string, number> = {};
      
      if (data && data.length > 0) {
        data.forEach(fuel => {
          if (fuel.current_level !== null && fuel.tank_capacity !== null && fuel.tank_capacity > 0) {
            const percentage = (fuel.current_level / fuel.tank_capacity) * 100;
            fuelLevels[fuel.fuel_type] = Math.min(Math.round(percentage), 100);
          } else {
            fuelLevels[fuel.fuel_type] = 0;
          }
        });
      }
      
      return fuelLevels;
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false
  });

  // Query for dashboard metrics with proper caching
  const { data: metrics = {
    totalSales: '₹0',
    customers: '0',
    fuelVolume: '0 L',
    growth: '0%'
  }, isLoading: isLoadingMetrics } = useQuery({
    queryKey: QUERY_KEYS.metrics(dateRange.from || startOfMonth(new Date()), dateRange.to || new Date()),
    queryFn: async () => {
      if (!fuelPumpId) {
        return {
          totalSales: '₹0',
          customers: '0',
          fuelVolume: '0 L',
          growth: '0%'
        };
      }
      
      // Get total sales amount for the selected period
      const { data: salesData, error: salesError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('fuel_pump_id', fuelPumpId)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
        
      if (salesError) throw salesError;
      
      // Get total sales amount for the previous period of same length
      const prevPeriodDays = dateRange.from && dateRange.to 
        ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
        
      const prevStartDate = format(subDays(dateRange.from || startOfMonth(new Date()), prevPeriodDays), 'yyyy-MM-dd');
      const prevEndDate = format(subDays(dateRange.to || new Date(), 1), 'yyyy-MM-dd');
      
      const { data: prevSalesData, error: prevSalesError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('fuel_pump_id', fuelPumpId)
        .gte('date', prevStartDate)
        .lte('date', prevEndDate);
        
      if (prevSalesError) throw prevSalesError;
      
      // Get fuel volume
      const { data: fuelData, error: fuelError } = await supabase
        .from('transactions')
        .select('quantity')
        .eq('fuel_pump_id', fuelPumpId)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
        
      if (fuelError) throw fuelError;
      
      // Get total customers for this fuel pump
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('fuel_pump_id', fuelPumpId);
        
      if (customerError) throw customerError;
      
      // Calculate total sales
      const totalSales = salesData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      const prevTotalSales = prevSalesData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
      
      // Calculate growth percentage
      let growthPercentage = '0%';
      if (prevTotalSales > 0) {
        const growth = ((totalSales - prevTotalSales) / prevTotalSales) * 100;
        growthPercentage = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
      }
      
      // Calculate total fuel volume
      const totalFuelVolume = fuelData?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
      
      return {
        totalSales: `₹${Math.round(totalSales).toLocaleString()}`,
        customers: `${customerCount || 0}`,
        fuelVolume: `${Math.round(totalFuelVolume).toLocaleString()} L`,
        growth: growthPercentage
      };
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Calculate loading state
  const isLoading = isLoadingSales || isLoadingFuel || isLoadingTransactions || 
                   isLoadingFuelLevels || isLoadingMetrics || isLoadingCredits;

  const handleDateRangeSelect = (range: DateRange) => {
    setDateRange(range);
    if (range.from && range.to) {
      setDatePickerOpen(false);
    }
  };

  const resetDateRange = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: new Date()
    });
    setDatePickerOpen(false);
  };

  const setQuickDateRange = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    setDateRange({ from, to });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2 flex flex-wrap gap-1">
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>Week</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>Month</Button>
                <Button variant="outline" size="sm" onClick={resetDateRange}>MTD</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>Quarter</Button>
              </div>
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground hidden sm:inline-block">
            Welcome back, <span className="font-medium text-foreground">{user?.username}</span>
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading dashboard data...</span>
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalSales}</div>
                    <p className="text-xs text-muted-foreground">{metrics.growth} from previous period</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.customers}</div>
                    <p className="text-xs text-muted-foreground">Total registered customers</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fuel Volume</CardTitle>
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.fuelVolume}</div>
                    <p className="text-xs text-muted-foreground">Total volume sold in period</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCredits}</div>
                    <p className="text-xs text-muted-foreground">Outstanding customer balances</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Growth</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.growth}</div>
                    <p className="text-xs text-muted-foreground">Compared to previous period</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Sales Trend</CardTitle>
                    <CardDescription>
                      Revenue for the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    {salesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData}>
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                          />
                          <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                          <Bar
                            dataKey="total"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No sales data available for the selected period
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Fuel Volume</CardTitle>
                    <CardDescription>
                      Petrol and diesel volumes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    {fuelData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={fuelData}>
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `${value}L`}
                          />
                          <Tooltip formatter={(value) => [`${value}L`, 'Volume']} />
                          <Line
                            type="monotone"
                            dataKey="petrol"
                            stroke="#FF6B35"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="diesel"
                            stroke="#004E89"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No fuel data available for the selected period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Recent sales and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentTransactions.length > 0 ? (
                      <div className="space-y-4">
                        {recentTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center gap-4 rounded-lg border p-3">
                            <div className="rounded-full bg-primary/10 p-2 text-primary">
                              <Droplets size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Transaction #{transaction.id.substring(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.fuel_type}: {transaction.quantity}L
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">₹{Number(transaction.amount).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground">
                        No recent transactions found
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Status</CardTitle>
                    <CardDescription>
                      Current fuel stock levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.keys(fuelLevels).length > 0 ? (
                        Object.entries(fuelLevels).map(([fuelType, percentage]) => (
                          <div key={fuelType} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <p>{fuelType}</p>
                              <p className="font-medium">{percentage}%</p>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div 
                                className={`h-full rounded-full ${
                                  fuelType.toLowerCase().includes('petrol') 
                                    ? 'bg-primary' 
                                    : fuelType.toLowerCase().includes('diesel')
                                    ? 'bg-blue-600'
                                    : 'bg-amber-500'
                                }`} 
                                style={{ width: `${percentage}%` }} 
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          No fuel inventory data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="h-[400px] flex justify-center items-center border rounded-md">
              <div className="text-center">
                <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                <p className="text-muted-foreground">More detailed analytics will be implemented here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="reports" className="h-[400px] flex justify-center items-center border rounded-md">
              <div className="text-center">
                <h3 className="text-lg font-medium">Reports</h3>
                <p className="text-muted-foreground">Generate and view reports here</p>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;
