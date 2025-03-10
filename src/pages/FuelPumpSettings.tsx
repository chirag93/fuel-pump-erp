
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Settings, Fuel, Gauge, Save, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FuelSettings {
  id: string;
  fuel_type: string;
  current_price: number;
  tank_capacity: number;
  current_level: number;
  updated_at: string;
}

const defaultFuelSettings = [
  {
    id: 'petrol-settings',
    fuel_type: 'Petrol',
    current_price: 100.50,
    tank_capacity: 10000,
    current_level: 5000,
    updated_at: new Date().toISOString()
  },
  {
    id: 'diesel-settings',
    fuel_type: 'Diesel',
    current_price: 90.75,
    tank_capacity: 15000,
    current_level: 8000,
    updated_at: new Date().toISOString()
  }
];

const FuelPumpSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('fuel-settings');
  const [fuelSettings, setFuelSettings] = useState<FuelSettings[]>(defaultFuelSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Query for fetching fuel settings
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['fuel-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('*');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          return data;
        } else {
          // If no settings found, use default values
          return defaultFuelSettings;
        }
      } catch (error) {
        console.error('Error fetching fuel settings:', error);
        toast({
          title: "Error",
          description: "Failed to load fuel settings. Using default values.",
          variant: "destructive"
        });
        return defaultFuelSettings;
      }
    }
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (settingsData) {
      setFuelSettings(settingsData);
      setIsLoading(false);
    }
  }, [settingsData]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: FuelSettings[]) => {
      try {
        // For each setting, upsert into the table
        for (const setting of updatedSettings) {
          const { error } = await supabase
            .from('fuel_settings')
            .upsert({
              id: setting.id,
              fuel_type: setting.fuel_type,
              current_price: setting.current_price,
              tank_capacity: setting.tank_capacity,
              current_level: setting.current_level,
              updated_at: new Date().toISOString()
            });
            
          if (error) throw error;
        }
        
        return updatedSettings;
      } catch (error) {
        console.error('Error saving fuel settings:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-settings'] });
      toast({
        title: "Success",
        description: "Fuel settings saved successfully."
      });
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle input change
  const handleSettingsChange = (index: number, field: string, value: string | number) => {
    const newSettings = [...fuelSettings];
    
    if (field === 'current_price' || field === 'tank_capacity' || field === 'current_level') {
      // Convert to number for numeric fields
      newSettings[index] = {
        ...newSettings[index],
        [field]: parseFloat(value as string) || 0
      };
    } else {
      // For text fields
      newSettings[index] = {
        ...newSettings[index],
        [field]: value
      };
    }
    
    setFuelSettings(newSettings);
  };

  // Handle save settings
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(fuelSettings);
  };

  // Calculate tank level percentage for visualization
  const getTankLevelPercentage = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Fuel Pump Settings
        </h1>
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="fuel-settings">
            <Fuel className="h-4 w-4 mr-2" />
            Fuel Settings
          </TabsTrigger>
          <TabsTrigger value="tank-settings">
            <Gauge className="h-4 w-4 mr-2" />
            Tank Levels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fuel-settings">
          <div className="grid gap-6 md:grid-cols-2">
            {fuelSettings.map((setting, index) => (
              <Card key={setting.id}>
                <CardHeader>
                  <CardTitle>{setting.fuel_type}</CardTitle>
                  <CardDescription>
                    Configure {setting.fuel_type.toLowerCase()} price and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`current-price-${index}`}>Current Price (₹/Litre)</Label>
                      <Input
                        id={`current-price-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={setting.current_price}
                        onChange={(e) => handleSettingsChange(index, 'current_price', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`tank-capacity-${index}`}>Tank Capacity (Litres)</Label>
                      <Input
                        id={`tank-capacity-${index}`}
                        type="number"
                        min="1"
                        value={setting.tank_capacity}
                        onChange={(e) => handleSettingsChange(index, 'tank_capacity', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`current-level-${index}`}>Current Level (Litres)</Label>
                      <Input
                        id={`current-level-${index}`}
                        type="number"
                        min="0"
                        max={setting.tank_capacity}
                        value={setting.current_level}
                        onChange={(e) => handleSettingsChange(index, 'current_level', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {((setting.current_level / setting.tank_capacity) * 100).toFixed(1)}% of tank capacity
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        Last Updated: {new Date(setting.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tank-settings">
          <div className="grid gap-6 md:grid-cols-2">
            {fuelSettings.map((setting) => (
              <Card key={setting.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{setting.fuel_type} Tank Level</CardTitle>
                  <CardDescription>
                    Current: {setting.current_level.toLocaleString()} / {setting.tank_capacity.toLocaleString()} litres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-32 bg-muted rounded-md relative overflow-hidden">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
                          setting.fuel_type === 'Petrol' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                        style={{ 
                          height: `${getTankLevelPercentage(setting.current_level, setting.tank_capacity)}%` 
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white drop-shadow-lg">
                          {getTankLevelPercentage(setting.current_level, setting.tank_capacity).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`update-level-${setting.id}`}>Update Level (Litres)</Label>
                        <div className="flex mt-1">
                          <Input
                            id={`update-level-${setting.id}`}
                            type="number"
                            min="0"
                            max={setting.tank_capacity}
                            value={setting.current_level}
                            onChange={(e) => {
                              const index = fuelSettings.findIndex(s => s.id === setting.id);
                              handleSettingsChange(index, 'current_level', e.target.value);
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Status</Label>
                        <div className="mt-1">
                          <div className={`px-3 py-2 rounded-md text-sm font-medium text-white ${
                            getTankLevelPercentage(setting.current_level, setting.tank_capacity) > 75 
                              ? 'bg-green-500' 
                              : getTankLevelPercentage(setting.current_level, setting.tank_capacity) > 25 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}>
                            {getTankLevelPercentage(setting.current_level, setting.tank_capacity) > 75 
                              ? 'Good' 
                              : getTankLevelPercentage(setting.current_level, setting.tank_capacity) > 25 
                                ? 'Moderate' 
                                : 'Low'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FuelPumpSettings;
