
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Droplet, BarChart3 } from 'lucide-react';
import { FuelTypeSettings } from '@/components/settings/FuelTypeSettings';
import { PumpSettings } from '@/components/settings/PumpSettings';
import { BusinessSettings } from '@/components/settings/BusinessSettings';

const FuelPumpSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="fuel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Droplet className="mr-2 h-4 w-4" />
            Fuel Types
          </TabsTrigger>
          <TabsTrigger value="pumps" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="mr-2 h-4 w-4" />
            Pump Configuration
          </TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="mr-2 h-4 w-4" />
            Business Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fuel" className="space-y-4">
          <FuelTypeSettings />
        </TabsContent>
        
        <TabsContent value="pumps" className="space-y-4">
          <PumpSettings />
        </TabsContent>
        
        <TabsContent value="business" className="space-y-4">
          <BusinessSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FuelPumpSettings;
