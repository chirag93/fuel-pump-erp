
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Droplet, BarChart3 } from 'lucide-react';
import { FuelTypeSettings } from '@/components/settings/FuelTypeSettings';
import { PumpSettings } from '@/components/settings/PumpSettings';
import { BusinessSettings } from '@/components/settings/BusinessSettings';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const FuelPumpSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  const { fuelPumpId, isAuthenticated } = useAuth();
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // This is now just for initial loading state
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!isAuthenticated) {
          console.log("User is not authenticated");
          toast({
            title: "Authentication Required",
            description: "Please log in to access settings",
            variant: "destructive"
          });
        } else if (!fuelPumpId) {
          console.log("User is authenticated but no fuel pump ID is available");
          toast({
            title: "Access Error",
            description: "You need to be associated with a fuel pump to access these settings",
            variant: "destructive"
          });
        } else {
          console.log("User is authenticated with fuel pump ID:", fuelPumpId);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [isAuthenticated, fuelPumpId]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <h2 className="text-xl font-medium">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to access fuel pump settings</p>
      </div>
    );
  }
  
  if (!fuelPumpId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <h2 className="text-xl font-medium">Fuel Pump Association Required</h2>
        <p className="text-muted-foreground">Your account is not associated with any fuel pump</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="business" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="mr-2 h-4 w-4" />
            Business Settings
          </TabsTrigger>
          <TabsTrigger value="fuel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Droplet className="mr-2 h-4 w-4" />
            Fuel Types
          </TabsTrigger>
          <TabsTrigger value="pumps" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="mr-2 h-4 w-4" />
            Pump Configuration
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="business" className="space-y-4">
          <BusinessSettings />
        </TabsContent>
        
        <TabsContent value="fuel" className="space-y-4">
          <FuelTypeSettings />
        </TabsContent>
        
        <TabsContent value="pumps" className="space-y-4">
          <PumpSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FuelPumpSettings;
