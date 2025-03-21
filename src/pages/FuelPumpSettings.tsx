import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Settings, 
  Droplet, 
  BarChart3, 
  Plus,
  Edit,
  Save,
  Trash2
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface FuelSettings {
  id: string;
  fuel_type: string;
  current_price: number;
  tank_capacity: number;
  current_level: number;
  updated_at?: string;
}

interface PumpSettings {
  id: string;
  pump_number: string;
  nozzle_count: number;
  fuel_types: string[];
  created_at?: string;
}

interface BusinessSettings {
  id?: string;
  gst_number: string;
  business_name: string;
  address: string;
}

const FuelPumpSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fuelSettings, setFuelSettings] = useState<FuelSettings[]>([]);
  const [pumpSettings, setPumpSettings] = useState<PumpSettings[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    gst_number: '',
    business_name: 'Fuel Pump ERP',
    address: '',
  });
  const [isAddFuelDialogOpen, setIsAddFuelDialogOpen] = useState(false);
  const [isAddPumpDialogOpen, setIsAddPumpDialogOpen] = useState(false);
  const [isEditFuelDialogOpen, setIsEditFuelDialogOpen] = useState(false);
  const [newFuelType, setNewFuelType] = useState<Partial<FuelSettings>>({
    fuel_type: '',
    current_price: 0,
    tank_capacity: 0,
    current_level: 0
  });
  const [editFuelType, setEditFuelType] = useState<FuelSettings | null>(null);
  const [newPump, setNewPump] = useState<Partial<PumpSettings>>({
    pump_number: '',
    nozzle_count: 1,
    fuel_types: []
  });
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data: fuelData, error: fuelError } = await supabase
        .from('fuel_settings')
        .select('*');
        
      if (fuelError) throw fuelError;
      
      if (fuelData) {
        setFuelSettings(fuelData as FuelSettings[]);
      }
      
      const { data: pumpData, error: pumpError } = await supabase
        .from('pump_settings')
        .select('*');
        
      if (pumpError) throw pumpError;
      
      if (pumpData) {
        setPumpSettings(pumpData as PumpSettings[]);
      }
      
      const { data: businessData, error: businessError } = await supabase
        .from('business_settings')
        .select('*')
        .maybeSingle();
        
      if (!businessError && businessData) {
        setBusinessSettings(businessData as BusinessSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFuelType = async () => {
    try {
      if (!newFuelType.fuel_type || newFuelType.current_price === undefined || 
          newFuelType.tank_capacity === undefined || newFuelType.current_level === undefined) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('fuel_settings')
        .insert([{
          fuel_type: newFuelType.fuel_type,
          current_price: newFuelType.current_price,
          tank_capacity: newFuelType.tank_capacity,
          current_level: newFuelType.current_level
        }])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setFuelSettings([...fuelSettings, data[0] as FuelSettings]);
        setIsAddFuelDialogOpen(false);
        setNewFuelType({
          fuel_type: '',
          current_price: 0,
          tank_capacity: 0,
          current_level: 0
        });
        
        toast({
          title: "Success",
          description: "Fuel type added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding fuel type:', error);
      toast({
        title: "Error",
        description: "Failed to add fuel type. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateFuelType = async () => {
    try {
      if (!editFuelType) {
        toast({
          title: "Error",
          description: "No fuel type selected for editing",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('fuel_settings')
        .update({
          fuel_type: editFuelType.fuel_type,
          current_price: editFuelType.current_price,
          tank_capacity: editFuelType.tank_capacity,
          current_level: editFuelType.current_level
        })
        .eq('id', editFuelType.id)
        .select();
        
      if (error) throw error;
      
      if (data) {
        // Update the fuel settings state with the updated fuel type
        setFuelSettings(fuelSettings.map(fuel => 
          fuel.id === editFuelType.id ? data[0] as FuelSettings : fuel
        ));
        
        setIsEditFuelDialogOpen(false);
        setEditFuelType(null);
        
        toast({
          title: "Success",
          description: "Fuel type updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating fuel type:', error);
      toast({
        title: "Error",
        description: "Failed to update fuel type. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEditFuelType = (fuel: FuelSettings) => {
    setEditFuelType(fuel);
    setIsEditFuelDialogOpen(true);
  };

  const handleAddPump = async () => {
    try {
      if (!newPump.pump_number || !newPump.nozzle_count) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('pump_settings')
        .insert([{
          pump_number: newPump.pump_number,
          nozzle_count: newPump.nozzle_count,
          fuel_types: newPump.fuel_types || []
        }])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setPumpSettings([...pumpSettings, data[0] as PumpSettings]);
        setIsAddPumpDialogOpen(false);
        setNewPump({
          pump_number: '',
          nozzle_count: 1,
          fuel_types: []
        });
        
        toast({
          title: "Success",
          description: "Pump added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding pump:', error);
      toast({
        title: "Error",
        description: "Failed to add pump. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateBusinessSettings = async () => {
    try {
      if (!businessSettings.gst_number) {
        toast({
          title: "Missing information",
          description: "Please enter GST number",
          variant: "destructive"
        });
        return;
      }
      
      const { data: existingData, error: existingError } = await supabase
        .from('business_settings')
        .select('*');
        
      if (existingError) throw existingError;
      
      if (existingData && existingData.length > 0) {
        const { error } = await supabase
          .from('business_settings')
          .update({
            gst_number: businessSettings.gst_number,
            business_name: businessSettings.business_name,
            address: businessSettings.address
          })
          .eq('id', existingData[0].id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_settings')
          .insert([{
            gst_number: businessSettings.gst_number,
            business_name: businessSettings.business_name,
            address: businessSettings.address
          }]);
          
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Business settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating business settings:', error);
      toast({
        title: "Error",
        description: "Failed to update business settings. Please try again.",
        variant: "destructive"
      });
    }
  };
  
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Fuel Types</h2>
            <Dialog open={isAddFuelDialogOpen} onOpenChange={setIsAddFuelDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fuel Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Fuel Type</DialogTitle>
                  <DialogDescription>
                    Configure new fuel type for your station
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fuel_type">Fuel Type</Label>
                    <Input 
                      id="fuel_type" 
                      placeholder="e.g. Petrol, Diesel, Premium"
                      value={newFuelType.fuel_type}
                      onChange={e => setNewFuelType({...newFuelType, fuel_type: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="current_price">Current Price (per liter)</Label>
                    <Input 
                      id="current_price" 
                      type="number"
                      value={newFuelType.current_price?.toString()}
                      onChange={e => setNewFuelType({...newFuelType, current_price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tank_capacity">Tank Capacity (liters)</Label>
                    <Input 
                      id="tank_capacity" 
                      type="number"
                      value={newFuelType.tank_capacity?.toString()}
                      onChange={e => setNewFuelType({...newFuelType, tank_capacity: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="current_level">Current Stock Level (liters)</Label>
                    <Input 
                      id="current_level" 
                      type="number"
                      value={newFuelType.current_level?.toString()}
                      onChange={e => setNewFuelType({...newFuelType, current_level: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddFuelDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddFuelType}>Add Fuel Type</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {fuelSettings.length === 0 ? (
                <div className="py-8 text-center">
                  <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No fuel types configured yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setIsAddFuelDialogOpen(true)}
                  >
                    Add First Fuel Type
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead className="text-right">Price (₹/L)</TableHead>
                      <TableHead className="text-right">Tank Capacity</TableHead>
                      <TableHead className="text-right">Current Level</TableHead>
                      <TableHead className="text-right">Last Updated</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelSettings.map((fuel) => (
                      <TableRow key={fuel.id}>
                        <TableCell className="font-medium">{fuel.fuel_type}</TableCell>
                        <TableCell className="text-right">₹{fuel.current_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{fuel.tank_capacity.toLocaleString()} L</TableCell>
                        <TableCell className="text-right">{fuel.current_level.toLocaleString()} L</TableCell>
                        <TableCell className="text-right">
                          {fuel.updated_at 
                            ? new Date(fuel.updated_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditFuelType(fuel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Fuel Type Dialog */}
          <Dialog open={isEditFuelDialogOpen} onOpenChange={setIsEditFuelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Fuel Type</DialogTitle>
                <DialogDescription>
                  Update fuel type configuration
                </DialogDescription>
              </DialogHeader>
              {editFuelType && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_fuel_type">Fuel Type</Label>
                    <Input 
                      id="edit_fuel_type" 
                      value={editFuelType.fuel_type}
                      onChange={e => setEditFuelType({...editFuelType, fuel_type: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_current_price">Current Price (per liter)</Label>
                    <Input 
                      id="edit_current_price" 
                      type="number"
                      value={editFuelType.current_price}
                      onChange={e => setEditFuelType({...editFuelType, current_price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_tank_capacity">Tank Capacity (liters)</Label>
                    <Input 
                      id="edit_tank_capacity" 
                      type="number"
                      value={editFuelType.tank_capacity}
                      onChange={e => setEditFuelType({...editFuelType, tank_capacity: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_current_level">Current Stock Level (liters)</Label>
                    <Input 
                      id="edit_current_level" 
                      type="number"
                      value={editFuelType.current_level}
                      onChange={e => setEditFuelType({...editFuelType, current_level: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditFuelDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateFuelType}>Update Fuel Type</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="pumps" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pump Configuration</h2>
            <Dialog open={isAddPumpDialogOpen} onOpenChange={setIsAddPumpDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pump
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Pump</DialogTitle>
                  <DialogDescription>
                    Configure a new fuel pump for your station
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pump_number">Pump Number</Label>
                    <Input 
                      id="pump_number" 
                      placeholder="e.g. P001, P002"
                      value={newPump.pump_number}
                      onChange={e => setNewPump({...newPump, pump_number: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nozzle_count">Number of Nozzles</Label>
                    <Input 
                      id="nozzle_count" 
                      type="number"
                      min="1"
                      max="4"
                      value={newPump.nozzle_count?.toString()}
                      onChange={e => setNewPump({...newPump, nozzle_count: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Available Fuel Types</Label>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {fuelSettings.map(fuel => (
                        <Button
                          key={fuel.fuel_type}
                          variant={newPump.fuel_types?.includes(fuel.fuel_type) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedFuelTypes = newPump.fuel_types || [];
                            if (updatedFuelTypes.includes(fuel.fuel_type)) {
                              setNewPump({
                                ...newPump, 
                                fuel_types: updatedFuelTypes.filter(f => f !== fuel.fuel_type)
                              });
                            } else {
                              setNewPump({
                                ...newPump,
                                fuel_types: [...updatedFuelTypes, fuel.fuel_type]
                              });
                            }
                          }}
                        >
                          {fuel.fuel_type}
                        </Button>
                      ))}
                    </div>
                    {fuelSettings.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No fuel types available. Add fuel types first.
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPumpDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddPump}>Add Pump</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {pumpSettings.length === 0 ? (
                <div className="py-8 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pumps configured yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setIsAddPumpDialogOpen(true)}
                  >
                    Add First Pump
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pump Number</TableHead>
                      <TableHead className="text-center">Nozzles</TableHead>
                      <TableHead>Fuel Types</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pumpSettings.map((pump) => (
                      <TableRow key={pump.id}>
                        <TableCell className="font-medium">{pump.pump_number}</TableCell>
                        <TableCell className="text-center">{pump.nozzle_count}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {pump.fuel_types?.map((fuel, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                              >
                                {fuel}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {pump.created_at 
                            ? new Date(pump.created_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Configure business details including GST information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input 
                    id="business_name" 
                    value={businessSettings.business_name} 
                    onChange={e => setBusinessSettings({...businessSettings, business_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input 
                    id="gst_number" 
                    value={businessSettings.gst_number} 
                    onChange={e => setBusinessSettings({...businessSettings, gst_number: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Business Address</Label>
                <Input 
                  id="address" 
                  value={businessSettings.address} 
                  onChange={e => setBusinessSettings({...businessSettings, address: e.target.value})}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateBusinessSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Business Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FuelPumpSettings;
