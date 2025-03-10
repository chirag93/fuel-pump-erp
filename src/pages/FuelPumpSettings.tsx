
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Settings, Droplet, Gauge, CreditCard } from 'lucide-react';
import { supabase, FuelSettings } from '@/integrations/supabase/client';

const FuelPumpSettings = () => {
  const [fuelSettings, setFuelSettings] = useState<FuelSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<FuelSettings | null>(null);
  
  // Fetch fuel settings
  useEffect(() => {
    const fetchFuelSettings = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setFuelSettings(data as FuelSettings[]);
          
          // If no settings exist, create default settings for Petrol and Diesel
          if (data.length === 0) {
            const defaultSettings = [
              {
                fuel_type: 'Petrol',
                current_price: 100.50,
                tank_capacity: 10000,
                current_level: 5000
              },
              {
                fuel_type: 'Diesel',
                current_price: 89.75,
                tank_capacity: 15000,
                current_level: 8000
              }
            ];
            
            const { error: insertError } = await supabase
              .from('fuel_settings')
              .insert(defaultSettings);
              
            if (insertError) {
              console.error('Error creating default settings:', insertError);
            } else {
              // Fetch again to get the IDs
              const { data: refreshedData } = await supabase
                .from('fuel_settings')
                .select('*');
                
              if (refreshedData) {
                setFuelSettings(refreshedData as FuelSettings[]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching fuel settings:', error);
        toast({
          title: "Error",
          description: "Failed to load fuel settings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFuelSettings();
  }, []);
  
  const handleEditSettings = (settings: FuelSettings) => {
    setEditingSettings({ ...settings });
    setIsDialogOpen(true);
  };
  
  const handleSaveSettings = async () => {
    try {
      if (!editingSettings) return;
      
      const { error } = await supabase
        .from('fuel_settings')
        .update({
          current_price: editingSettings.current_price,
          tank_capacity: editingSettings.tank_capacity,
          current_level: editingSettings.current_level
        })
        .eq('id', editingSettings.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setFuelSettings(prev => 
        prev.map(item => 
          item.id === editingSettings.id ? editingSettings : item
        )
      );
      
      toast({
        title: "Success",
        description: `${editingSettings.fuel_type} settings updated successfully`
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating fuel settings:', error);
      toast({
        title: "Error",
        description: "Failed to update fuel settings. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fuel Pump Settings</h1>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading fuel settings...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {fuelSettings.map((settings) => (
              <Card key={settings.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{settings.fuel_type}</CardTitle>
                    <Droplet className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>
                    Configure fuel tank and pricing settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                      <p className="text-2xl font-bold">₹{settings.current_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tank Capacity</p>
                      <p className="text-2xl font-bold">{settings.tank_capacity.toLocaleString()} L</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Level</p>
                    <div className="mt-2 h-4 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(settings.current_level / settings.tank_capacity) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>{settings.current_level.toLocaleString()} L</span>
                      <span>{((settings.current_level / settings.tank_capacity) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleEditSettings(settings)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Settings
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {editingSettings?.fuel_type} Settings</DialogTitle>
            <DialogDescription>
              Update price, tank capacity and current fuel level
            </DialogDescription>
          </DialogHeader>
          
          {editingSettings && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current_price">Current Price (₹)</Label>
                <Input
                  id="current_price"
                  type="number"
                  step="0.01"
                  value={editingSettings.current_price}
                  onChange={(e) => setEditingSettings({
                    ...editingSettings,
                    current_price: parseFloat(e.target.value)
                  })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tank_capacity">Tank Capacity (Litres)</Label>
                <Input
                  id="tank_capacity"
                  type="number"
                  value={editingSettings.tank_capacity}
                  onChange={(e) => setEditingSettings({
                    ...editingSettings,
                    tank_capacity: parseFloat(e.target.value)
                  })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="current_level">Current Level (Litres)</Label>
                <Input
                  id="current_level"
                  type="number"
                  max={editingSettings.tank_capacity}
                  value={editingSettings.current_level}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const cappedValue = Math.min(value, editingSettings.tank_capacity);
                    setEditingSettings({
                      ...editingSettings,
                      current_level: cappedValue
                    });
                  }}
                />
                <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${(editingSettings.current_level / editingSettings.tank_capacity) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((editingSettings.current_level / editingSettings.tank_capacity) * 100).toFixed(1)}% full
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FuelPumpSettings;
