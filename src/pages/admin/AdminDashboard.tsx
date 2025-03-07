import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Users, Truck, AlertCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface FuelPumpStats {
  id: number;
  name: string;
  location: string;
  petrol_capacity: number;
  diesel_capacity: number;
  petrol_current_level: number;
  diesel_current_level: number;
  today_petrol_sales: number;
  today_diesel_sales: number;
  today_petrol_volume: number;
  today_diesel_volume: number;
  active_staff_count: number;
  today_transaction_count: number;
}

const AdminDashboard = () => {
  const { data: fuelPumps, isLoading } = useQuery({
    queryKey: ['fuelPumps'],
    queryFn: async () => {
      const response = await fetch('/api/fuelpumps/');
      if (!response.ok) {
        throw new Error('Failed to fetch fuel pumps');
      }
      return response.json();
    }
  });

  const [pumpsStats, setPumpsStats] = useState<FuelPumpStats[]>([]);

  useEffect(() => {
    if (fuelPumps && fuelPumps.length > 0) {
      const fetchStats = async () => {
        const statsPromises = fuelPumps.map(async (pump: any) => {
          const response = await fetch(`/api/fuelpumps/${pump.id}/stats/`);
          if (response.ok) {
            const stats = await response.json();
            return { ...stats, id: pump.id };
          }
          return null;
        });
        
        const stats = await Promise.all(statsPromises);
        setPumpsStats(stats.filter(Boolean));
      };
      
      fetchStats();
    }
  }, [fuelPumps]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  const totalPetrolSales = pumpsStats.reduce((sum, pump) => sum + pump.today_petrol_sales, 0);
  const totalDieselSales = pumpsStats.reduce((sum, pump) => sum + pump.today_diesel_sales, 0);
  const totalTransactions = pumpsStats.reduce((sum, pump) => sum + pump.today_transaction_count, 0);
  const totalStaff = pumpsStats.reduce((sum, pump) => sum + pump.active_staff_count, 0);
  const totalPumps = pumpsStats.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of all fuel pumps in the network.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pumps</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPumps}</div>
            <p className="text-xs text-muted-foreground">Active fuel stations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalPetrolSales + totalDieselSales).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all pumps today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">Active across all pumps</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-6 mb-4">Fuel Pump Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pumpsStats.map((pump) => (
          <Card key={pump.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle>{pump.name}</CardTitle>
              <CardDescription>{pump.location}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Petrol Level</p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(pump.petrol_current_level / pump.petrol_capacity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((pump.petrol_current_level / pump.petrol_capacity) * 100)}% ({pump.petrol_current_level.toFixed(2)} L)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Diesel Level</p>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(pump.diesel_current_level / pump.diesel_capacity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((pump.diesel_current_level / pump.diesel_capacity) * 100)}% ({pump.diesel_current_level.toFixed(2)} L)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium">Today's Sales</p>
                    <p className="text-lg">₹{(pump.today_petrol_sales + pump.today_diesel_sales).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Transactions</p>
                    <p className="text-lg">{pump.today_transaction_count}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
