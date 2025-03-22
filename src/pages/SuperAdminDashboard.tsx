
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FuelPump } from '@/integrations/supabase/client';
import { Fuel, Users, Clock, Check } from 'lucide-react';
import { getAllFuelPumps } from '@/integrations/fuelPumps';

const SuperAdminDashboard = () => {
  const [fuelPumps, setFuelPumps] = useState<FuelPump[]>([]);
  const [activePumps, setActivePumps] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchFuelPumps = async () => {
      try {
        setIsLoading(true);
        const data = await getAllFuelPumps();
        setFuelPumps(data);
        setActivePumps(data.filter(pump => pump.status === 'active').length || 0);
      } catch (error) {
        console.error('Error fetching fuel pumps:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFuelPumps();
  }, []);
  
  // Get the date of the most recently created fuel pump
  const latestPumpDate = fuelPumps.length > 0 
    ? new Date(Math.max(...fuelPumps.map(pump => new Date(pump.created_at).getTime())))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and monitor all fuel pumps in the network
        </p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-1 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fuel Pumps</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fuelPumps.length}</div>
              <p className="text-xs text-muted-foreground">
                Pumps registered in the system
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Pumps</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePumps}</div>
              <p className="text-xs text-muted-foreground">
                Currently operational pumps
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Pumps</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fuelPumps.length - activePumps}</div>
              <p className="text-xs text-muted-foreground">
                Pumps currently not operational
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Provision</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestPumpDate 
                  ? new Intl.DateTimeFormat('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }).format(latestPumpDate)
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Most recent pump creation
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Fuel Pumps</h2>
        <div className="rounded-md border">
          <div className="grid">
            <div className="bg-muted px-4 py-3 font-medium grid grid-cols-4">
              <div>Name</div>
              <div>Email</div>
              <div>Status</div>
              <div>Created</div>
            </div>
            <div className="divide-y">
              {fuelPumps.length === 0 ? (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  No fuel pumps have been provisioned yet.
                </div>
              ) : (
                fuelPumps.slice(0, 5).map((pump) => (
                  <div key={pump.id} className="grid grid-cols-4 px-4 py-3">
                    <div className="font-medium">{pump.name}</div>
                    <div>{pump.email}</div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pump.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pump.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(pump.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
