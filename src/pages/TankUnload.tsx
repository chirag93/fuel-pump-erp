
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Droplet, Truck } from 'lucide-react';

const TankUnload = () => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentUnloads, setRecentUnloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fuelTypes, setFuelTypes] = useState([]);

  // Fetch fuel types and recent unloads when component mounts
  useEffect(() => {
    fetchFuelTypes();
    fetchRecentUnloads();
  }, []);

  const fetchFuelTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('fuel_type')
        .order('fuel_type');

      if (error) throw error;
      
      if (data) {
        setFuelTypes(data.map(item => item.fuel_type));
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error);
      toast({
        title: "Error",
        description: "Could not load fuel types",
        variant: "destructive"
      });
    }
  };

  const fetchRecentUnloads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (data) {
        setRecentUnloads(data);
      }
    } catch (error) {
      console.error('Error fetching recent unloads:', error);
      toast({
        title: "Error",
        description: "Could not load recent unloads",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!vehicleNumber || !fuelType || !quantity || !amount) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Insert new tank unload record
      const { error } = await supabase
        .from('tank_unloads')
        .insert([{
          vehicle_number: vehicleNumber,
          fuel_type: fuelType,
          quantity: parseFloat(quantity),
          amount: parseFloat(amount),
          date: new Date(date).toISOString()
        }]);
      
      if (error) throw error;
      
      // Success - reset form and refresh data
      toast({
        title: "Success",
        description: "Tank unloading record created"
      });
      
      // Reset form
      setVehicleNumber('');
      setQuantity('');
      setAmount('');
      
      // Refresh the recent unloads list
      fetchRecentUnloads();
      
    } catch (error) {
      console.error('Error recording tank unload:', error);
      toast({
        title: "Error",
        description: "Could not record tank unload",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tank Unload</h1>
        <Truck className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Record Tank Unload</CardTitle>
            <CardDescription>Enter details of the incoming fuel tank</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input 
                  id="vehicleNumber" 
                  value={vehicleNumber} 
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. KA-01-AB-1234"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={fuelType} onValueChange={setFuelType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (Liters)</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5000"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 450000"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Tank Unload'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tank Unloads</CardTitle>
            <CardDescription>View the latest tank unloading records</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentUnloads.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Droplet className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No tank unloads recorded yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">Quantity (L)</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUnloads.map((unload) => (
                    <TableRow key={unload.id}>
                      <TableCell className="font-medium">{unload.vehicle_number}</TableCell>
                      <TableCell>{unload.fuel_type}</TableCell>
                      <TableCell className="text-right">{Number(unload.quantity).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{Number(unload.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {new Date(unload.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TankUnload;
