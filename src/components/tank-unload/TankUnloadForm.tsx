
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface TankUnloadFormProps {
  onSuccess: () => void;
}

const TankUnloadForm = ({ onSuccess }: TankUnloadFormProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Notify parent component to refresh the list
      onSuccess();
      
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
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <span>Record Tank Unload</span>
        </CardTitle>
        <CardDescription>
          Enter the details of the fuel delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Tanker Vehicle Number</Label>
            <Input
              id="vehicleNumber"
              placeholder="e.g., MH01AB1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="bg-background"
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (in Liters)</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 5000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-background"
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
                className="bg-background"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Unload"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TankUnloadForm;
