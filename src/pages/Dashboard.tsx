import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart } from 'recharts';
import { ArrowUpCircle, DollarSign, Users, Droplets, TrendingUp, Fuel } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const salesData = [
  { name: 'Mon', total: 5300 },
  { name: 'Tue', total: 6200 },
  { name: 'Wed', total: 8100 },
  { name: 'Thu', total: 7400 },
  { name: 'Fri', total: 9100 },
  { name: 'Sat', total: 10800 },
  { name: 'Sun', total: 7600 },
];

const fuelData = [
  { name: 'Mon', petrol: 800, diesel: 1200 },
  { name: 'Tue', petrol: 900, diesel: 1400 },
  { name: 'Wed', petrol: 1100, diesel: 1600 },
  { name: 'Thu', petrol: 1000, diesel: 1300 },
  { name: 'Fri', petrol: 1200, diesel: 1700 },
  { name: 'Sat', petrol: 1500, diesel: 2100 },
  { name: 'Sun', petrol: 1100, diesel: 1500 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const metrics = {
    totalSales: '₹58,500',
    customers: '134',
    fuelVolume: '6,450 L',
    growth: '+12.5%'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
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
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSales}</div>
                <p className="text-xs text-muted-foreground">+18% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.customers}</div>
                <p className="text-xs text-muted-foreground">+4 new today</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fuel Volume</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.fuelVolume}</div>
                <p className="text-xs text-muted-foreground">+7% from yesterday</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.growth}</div>
                <p className="text-xs text-muted-foreground">Since last month</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Weekly Sales</CardTitle>
                <CardDescription>
                  Total sales for the current week
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
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
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Recent transactions and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Droplets size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Transaction #{10000 + i}</p>
                        <p className="text-xs text-muted-foreground">Petrol: 20L - Customer: Walk-in</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{2000 + (i * 150)}</p>
                        <p className="text-xs text-muted-foreground">10 min ago</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <p>Petrol</p>
                      <p className="font-medium">75%</p>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full w-3/4 rounded-full bg-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <p>Diesel</p>
                      <p className="font-medium">60%</p>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full w-3/5 rounded-full bg-blue-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <p>Engine Oil</p>
                      <p className="font-medium">45%</p>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full w-2/5 rounded-full bg-amber-500" />
                    </div>
                  </div>
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
      </Tabs>
    </div>
  );
};

export default Dashboard;
