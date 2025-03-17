
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SuperAdminAnalytics = () => {
  // Dummy data for demonstration
  const data = [
    { month: 'Jan', pumps: 5 },
    { month: 'Feb', pumps: 7 },
    { month: 'Mar', pumps: 8 },
    { month: 'Apr', pumps: 12 },
    { month: 'May', pumps: 16 },
    { month: 'Jun', pumps: 20 },
    { month: 'Jul', pumps: 24 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      <p className="text-muted-foreground">
        View analytics and growth metrics for your fuel pump network
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Network Growth</CardTitle>
          <CardDescription>
            The number of new fuel pumps provisioned each month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pumps" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Usage</CardTitle>
            <CardDescription>
              Advanced analytics coming soon
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Detailed usage analytics will be available in a future update.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Advanced analytics coming soon
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Performance metrics will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
