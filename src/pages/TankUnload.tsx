
import { useState, useEffect } from 'react';
import TankUnloadForm from "@/components/tank-unload/TankUnloadForm";
import RecentUnloadsTable from "@/components/tank-unload/RecentUnloadsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Calendar, TrendingUp, Fuel, FileSpreadsheet } from 'lucide-react';
import { useTankUnloads, TankUnload as TankUnloadType } from "@/hooks/useTankUnloads";
import FuelTankDisplay from '@/components/fuel/FuelTankDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { getFuelPumpId } from '@/integrations/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const TankUnload = () => {
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const { recentUnloads, isLoading } = useTankUnloads(refreshCounter);
  const { isAuthenticated } = useAuth();

  // Fetch available fuel types
  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available for fetching fuel types');
          if (!isAuthenticated) {
            toast({
              title: "Authentication Required",
              description: "Please sign in to view fuel types",
              variant: "destructive"
            });
          }
          return;
        }
        
        console.log(`Fetching fuel types for fuel pump ID: ${fuelPumpId}`);
        
        // First check fuel_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('fuel_settings')
          .select('fuel_type')
          .eq('fuel_pump_id', fuelPumpId);
          
        if (settingsError) {
          console.error('Error fetching fuel settings:', settingsError);
        }
          
        if (settingsData && settingsData.length > 0) {
          const types = settingsData.map(item => item.fuel_type);
          setFuelTypes([...new Set(types)]);
          console.log(`Found ${types.length} fuel types from settings`);
        } else {
          // Fallback to inventory
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('fuel_type')
            .eq('fuel_pump_id', fuelPumpId);
            
          if (inventoryError) {
            console.error('Error fetching inventory:', inventoryError);
          }
            
          if (inventoryData && inventoryData.length > 0) {
            const types = inventoryData.map(item => item.fuel_type);
            setFuelTypes([...new Set(types)]);
            console.log(`Found ${types.length} fuel types from inventory`);
          } else {
            // Default values if nothing is found
            console.log('No fuel types found, using defaults');
            setFuelTypes(['Petrol', 'Diesel']);
          }
        }
      } catch (error) {
        console.error('Error fetching fuel types:', error);
        setFuelTypes(['Petrol', 'Diesel']);
      }
    };
    
    fetchFuelTypes();
  }, [refreshCounter, isAuthenticated]);

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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Fuel className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="record">
            <Truck className="mr-2 h-4 w-4" />
            Record Unload
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Unload History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
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
            {fuelTypes.map((fuelType, index) => (
              <FuelTankDisplay 
                key={index}
                fuelType={fuelType} 
                refreshTrigger={refreshCounter}
                showTankIcon={true}
              />
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Unloads</CardTitle>
              <CardDescription>
                Recent fuel deliveries received at your station
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentUnloadsTable refreshTrigger={refreshCounter} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="record">
          <Card>
            <CardHeader>
              <CardTitle>Record New Tank Unload</CardTitle>
              <CardDescription>
                Enter details of a fuel delivery received at your station
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TankUnloadForm onSuccess={handleUnloadSuccess} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Unload History</CardTitle>
              <CardDescription>
                Complete history of fuel deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentUnloadsTable refreshTrigger={refreshCounter} showAll={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TankUnload;
