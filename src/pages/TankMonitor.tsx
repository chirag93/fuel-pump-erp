
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Fuel, BarChart3, History, Droplets, AlertCircle } from 'lucide-react';
import FuelTankDisplay from '@/components/fuel/FuelTankDisplay';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FuelSettings } from '@/components/settings/FuelTypeSettings';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface PriceHistory {
  date: string;
  price: number;
}

const TankMonitor = () => {
  const [fuelTypes, setFuelTypes] = useState<FuelSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [priceHistory, setPriceHistory] = useState<{[key: string]: PriceHistory[]}>({});

  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        setIsLoading(true);
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          toast({
            title: "Authentication Required",
            description: "Please log in with a fuel pump account to view fuel information",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Fetch fuel settings
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('*')
          .eq('fuel_pump_id', fuelPumpId);
          
        if (error) {
          console.error('Error fetching fuel types:', error);
          toast({
            title: "Error",
            description: "Failed to load fuel information",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        if (data && data.length > 0) {
          setFuelTypes(data as FuelSettings[]);
          
          // Fetch historical price data
          const historyData: {[key: string]: PriceHistory[]} = {};
          
          for (const fuel of data) {
            const { data: transactionData, error: transactionError } = await supabase
              .from('transactions')
              .select('date, fuel_type, amount, quantity')
              .eq('fuel_type', fuel.fuel_type)
              .eq('fuel_pump_id', fuelPumpId)
              .order('date', { ascending: false })
              .limit(10);
              
            if (!transactionError && transactionData && transactionData.length > 0) {
              const prices: PriceHistory[] = transactionData.map(t => ({
                date: new Date(t.date).toLocaleDateString(),
                price: t.quantity > 0 ? Number((t.amount / t.quantity).toFixed(2)) : 0
              }));
              
              // Remove duplicates by date
              const uniquePrices = prices.filter((price, index, self) =>
                index === self.findIndex((p) => p.date === price.date)
              );
              
              historyData[fuel.fuel_type] = uniquePrices;
            }
          }
          
          setPriceHistory(historyData);
        } else {
          toast({
            title: "No Fuel Settings",
            description: "No fuel types configured. Please add them in settings.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error in fetchFuelTypes:', error);
        toast({
          title: "Error",
          description: "Failed to load fuel information",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFuelTypes();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getLevelStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage < 10) return 'critical';
    if (percentage < 25) return 'low';
    if (percentage > 85) return 'high';
    return 'normal';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading fuel information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tank Monitor</h2>
          <p className="text-muted-foreground">Monitor your fuel tanks, levels, and prices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh Data
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings">
              Configure Tanks
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Fuel className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="levels">
            <Droplets className="mr-2 h-4 w-4" />
            Tank Levels
          </TabsTrigger>
          <TabsTrigger value="prices">
            <BarChart3 className="mr-2 h-4 w-4" />
            Fuel Prices
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Price History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {fuelTypes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Fuel Types Configured</h3>
                <p className="text-muted-foreground mt-2 text-center max-w-md">
                  You haven't configured any fuel types yet. Go to Settings to add fuel types and tank configurations.
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/settings">
                    Configure Fuel Types
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">Total Fuel Types</CardTitle>
                    <CardDescription>Number of fuel types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">{fuelTypes.length}</div>
                    <p className="text-sm text-muted-foreground">fuel variants</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">Total Capacity</CardTitle>
                    <CardDescription>Combined storage capacity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      {fuelTypes.reduce((sum, fuel) => sum + (fuel.tank_capacity || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">liters</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">Current Stock</CardTitle>
                    <CardDescription>Total available fuel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold">
                      {fuelTypes.reduce((sum, fuel) => sum + (fuel.current_level || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">liters</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {fuelTypes.map((fuel) => (
                  <FuelTankDisplay 
                    key={fuel.id}
                    fuelType={fuel.fuel_type}
                    capacity={fuel.tank_capacity}
                    lastUpdated={fuel.updated_at}
                    showTankIcon={true}
                    refreshTrigger={refreshTrigger}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tank Levels</CardTitle>
              <CardDescription>Current fuel stock levels and capacity</CardDescription>
            </CardHeader>
            <CardContent>
              {fuelTypes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No fuel types configured yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Fuel Type</th>
                        <th className="text-right py-3 font-medium">Tank Capacity</th>
                        <th className="text-right py-3 font-medium">Current Level</th>
                        <th className="text-right py-3 font-medium">Fill %</th>
                        <th className="text-right py-3 font-medium">Status</th>
                        <th className="text-right py-3 font-medium">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelTypes.map((fuel) => {
                        const fillPercentage = Math.round((fuel.current_level / fuel.tank_capacity) * 100);
                        const status = getLevelStatus(fuel.current_level, fuel.tank_capacity);
                        return (
                          <tr key={fuel.id} className="border-b">
                            <td className="py-3 font-medium">{fuel.fuel_type}</td>
                            <td className="text-right py-3">{fuel.tank_capacity.toLocaleString()} L</td>
                            <td className="text-right py-3">{fuel.current_level.toLocaleString()} L</td>
                            <td className="text-right py-3">{fillPercentage}%</td>
                            <td className="text-right py-3">
                              <Badge 
                                variant={
                                  status === 'critical' ? 'destructive' :
                                  status === 'low' ? 'warning' :
                                  status === 'high' ? 'success' : 'outline'
                                }
                              >
                                {status === 'critical' ? 'Critical' :
                                 status === 'low' ? 'Low' :
                                 status === 'high' ? 'High' : 'Normal'}
                              </Badge>
                            </td>
                            <td className="text-right py-3">
                              {fuel.updated_at ? new Date(fuel.updated_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Prices</CardTitle>
              <CardDescription>Current pricing for different fuel types</CardDescription>
            </CardHeader>
            <CardContent>
              {fuelTypes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No fuel types configured yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Fuel Type</th>
                        <th className="text-right py-3 font-medium">Current Price (₹/L)</th>
                        <th className="text-right py-3 font-medium">Total Value</th>
                        <th className="text-right py-3 font-medium">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelTypes.map((fuel) => {
                        const totalValue = fuel.current_price * fuel.current_level;
                        return (
                          <tr key={fuel.id} className="border-b">
                            <td className="py-3 font-medium">{fuel.fuel_type}</td>
                            <td className="text-right py-3">₹{fuel.current_price.toFixed(2)}</td>
                            <td className="text-right py-3">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="text-right py-3">
                              {fuel.updated_at ? new Date(fuel.updated_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-medium">
                        <td className="py-3">Total</td>
                        <td className="text-right py-3">-</td>
                        <td className="text-right py-3">
                          ₹{fuelTypes
                            .reduce((sum, fuel) => sum + (fuel.current_price * fuel.current_level), 0)
                            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right py-3">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <CardDescription>Recent price changes based on transaction data</CardDescription>
            </CardHeader>
            <CardContent>
              {fuelTypes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No fuel types configured yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {fuelTypes.map((fuel) => (
                    <div key={fuel.id} className="space-y-2">
                      <h3 className="font-medium">{fuel.fuel_type}</h3>
                      {priceHistory[fuel.fuel_type] && priceHistory[fuel.fuel_type].length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium">Date</th>
                                <th className="text-right py-2 font-medium">Price (₹/L)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {priceHistory[fuel.fuel_type].map((entry, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2">{entry.date}</td>
                                  <td className="text-right py-2">₹{entry.price.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No historical price data available</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TankMonitor;
