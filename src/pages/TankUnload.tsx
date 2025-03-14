
import { useState } from 'react';
import TankUnloadForm from "@/components/tank-unload/TankUnloadForm";
import RecentUnloadsTable from "@/components/tank-unload/RecentUnloadsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Calendar, TrendingUp } from 'lucide-react';
import { useTankUnloads, TankUnload as TankUnloadType } from "@/hooks/useTankUnloads";

const TankUnload = () => {
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { recentUnloads, isLoading } = useTankUnloads(refreshCounter);

  const handleUnloadSuccess = () => {
    // Increment the counter to trigger a refresh in the table
    setRefreshCounter(prev => prev + 1);
  };

  // Calculate total statistics
  const totalLiters = recentUnloads.reduce((sum, unload) => sum + unload.quantity, 0);
  const totalAmount = recentUnloads.reduce((sum, unload) => sum + unload.amount, 0);
  
  // Get today's unloads
  const today = new Date().toISOString().split('T')[0];
  const todaysUnloads = recentUnloads.filter(unload => {
    return unload.date.split('T')[0] === today;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tank Unload</h2>
        <p className="text-muted-foreground">Record fuel delivery details when a tanker unloads at your station</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Today's Deliveries</CardTitle>
            <CardDescription>Fuel deliveries recorded today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{todaysUnloads.length}</div>
            <p className="text-sm text-muted-foreground">deliveries</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Total Quantity</CardTitle>
            <CardDescription>Total fuel delivered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalLiters.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">liters</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Total Value</CardTitle>
            <CardDescription>Value of delivered fuel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">₹{totalAmount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">in deliveries</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <TankUnloadForm onSuccess={handleUnloadSuccess} />
        <RecentUnloadsTable refreshTrigger={refreshCounter} />
      </div>
    </div>
  );
};

export default TankUnload;
