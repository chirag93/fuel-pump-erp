
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface TankUnload {
  id: string;
  vehicle_number: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  date: string;
}

const TankUnload = () => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentUnloads, setRecentUnloads] = useState<TankUnload[]>([]);
  
  // Define fetchRecentUnloads before using it
  const fetchRecentUnloads = async () => {
    try {
      const { data, error } = await supabase
        .from('tank_unloads')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setRecentUnloads(data as TankUnload[]);
      }
    } catch (error) {
      console.error('Error fetching unloads:', error);
    }
  };
  
  // Use useEffect to fetch data on component mount
  useEffect(() => {
    fetchRecentUnloads();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleNumber || !fuelType || !quantity || !amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const numericQuantity = parseFloat(quantity);
      const numericAmount = parseFloat(amount);
      
      const { error } = await supabase
        .from('tank_unloads')
        .insert({
          vehicle_number: vehicleNumber,
          fuel_type: fuelType,
          quantity: numericQuantity,
          amount: numericAmount,
          date: new Date().toISOString()
        });
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Tank unload recorded successfully",
      });
      
      // Reset form
      setVehicleNumber("");
      setFuelType("Petrol");
      setQuantity("");
      setAmount("");
      
      // Refresh the list
      fetchRecentUnloads();
      
    } catch (error) {
      console.error('Error recording unload:', error);
      toast({
        title: "Error",
        description: "Failed to record tank unload",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tank Unload</h2>
          <p className="text-muted-foreground">Record fuel delivery details when a tanker unloads at your station</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <span>Record Tank Unload</span>
              </CardTitle>
              <CardDescription>
                Enter the details of the fuel delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Tanker Vehicle Number</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="e.g., MH01AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Premium Petrol">Premium Petrol</SelectItem>
                      <SelectItem value="Premium Diesel">Premium Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (in Liters)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="e.g., 5000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (in ₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 450000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Recording..." : "Record Unload"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Unloads</CardTitle>
              <CardDescription>
                Recently recorded fuel deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Fuel</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUnloads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No recent unloads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentUnloads.map((unload) => (
                        <TableRow key={unload.id}>
                          <TableCell className="font-medium">
                            {format(new Date(unload.date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>{unload.vehicle_number}</TableCell>
                          <TableCell>{unload.fuel_type}</TableCell>
                          <TableCell>{unload.quantity.toLocaleString()} L</TableCell>
                          <TableCell>₹{unload.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TankUnload;
