
import { useState, useEffect } from 'react';
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
import { ArrowUpCircle, DollarSign, Users, Droplets, TrendingUp, Fuel, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  getSalesData, 
  getFuelVolumeData, 
  getRecentTransactions, 
  getCurrentFuelLevels,
  getDashboardMetrics
} from '@/utils/dashboardUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [fuelData, setFuelData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [fuelLevels, setFuelLevels] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState({
    totalSales: '₹0',
    customers: '0',
    fuelVolume: '0 L',
    growth: '0%'
  });

  // Date range state for filtering
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const startDate = dateRange.from || startOfMonth(new Date());
      const endDate = dateRange.to || new Date();

      // Load all dashboard data
      const [salesChartData, fuelChartData, transactions, levels, dashboardMetrics] = await Promise.all([
        getSalesData(startDate, endDate),
        getFuelVolumeData(startDate, endDate),
        getRecentTransactions(),
        getCurrentFuelLevels(),
        getDashboardMetrics(startDate, endDate)
      ]);

      setSalesData(salesChartData);
      setFuelData(fuelChartData);
      setRecentTransactions(transactions);
      setFuelLevels(levels);
      setMetrics(dashboardMetrics);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
