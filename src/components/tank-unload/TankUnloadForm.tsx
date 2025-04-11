
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getFuelPumpId } from "@/integrations/utils";

interface TankUnloadFormProps {
  onSuccess: () => void;
}

const TankUnloadForm = ({ onSuccess }: TankUnloadFormProps) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [tankerRent, setTankerRent] = useState("");
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
      const numericTankerRent = tankerRent ? parseFloat(tankerRent) : 0;
      
      // Get current fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        throw new Error("No fuel pump ID available. Please log in with a valid account.");
      }
      
      console.log(`Creating tank unload for fuel pump ID: ${fuelPumpId}`);
      
      // Insert the tank unload record with the fuel pump ID
      const { error } = await supabase
        .from('tank_unloads')
        .insert({
          vehicle_number: vehicleNumber,
          fuel_type: fuelType,
          quantity: numericQuantity,
          amount: numericAmount,
          tanker_rent: numericTankerRent,
          date: new Date().toISOString(),
          fuel_pump_id: fuelPumpId
        });
        
      if (error) {
        throw error;
      }
      
      // Update the fuel settings for this fuel type
      await updateFuelStorage(fuelType, numericQuantity, fuelPumpId);
      
      toast({
        title: "Success",
        description: "Tank unload recorded successfully",
      });
      
      // Reset form
      setVehicleNumber("");
      setFuelType("Petrol");
      setQuantity("");
      setAmount("");
      setTankerRent("");
      
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

  // New function to update fuel storage levels
  const updateFuelStorage = async (fuelType: string, addedQuantity: number, fuelPumpId: string) => {
    try {
      // First, check if there's an entry in fuel_settings for this fuel type
      const { data: settingsData, error: settingsError } = await supabase
        .from('fuel_settings')
        .select('current_level, tank_capacity')
        .eq('fuel_type', fuelType)
        .eq('fuel_pump_id', fuelPumpId)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settingsData) {
        // Fuel settings entry exists, update the current level
        const newLevel = Number(settingsData.current_level) + addedQuantity;
        
        const { error: updateError } = await supabase
          .from('fuel_settings')
          .update({
            current_level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('fuel_type', fuelType)
          .eq('fuel_pump_id', fuelPumpId);

        if (updateError) {
          throw updateError;
        }
        
        console.log(`Updated ${fuelType} storage to ${newLevel} liters for fuel pump ${fuelPumpId}`);
      } else {
        // No fuel settings entry, check if there's a recent inventory entry
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .eq('fuel_type', fuelType)
          .eq('fuel_pump_id', fuelPumpId)
          .order('date', { ascending: false })
          .limit(1);
          
        if (inventoryError) {
          throw inventoryError;
        }
        
        let baseQuantity = 0;
        let tankCapacity = fuelType === 'Petrol' ? 10000 : 12000; // Default tank capacities
        
        // If we have inventory data, use it as the base
        if (inventoryData && inventoryData.length > 0) {
          baseQuantity = Number(inventoryData[0].quantity);
        }
        
        // Create a new entry in fuel_settings
        const { error: insertError } = await supabase
          .from('fuel_settings')
          .insert({
            fuel_type: fuelType,
            current_level: baseQuantity + addedQuantity,
            current_price: inventoryData?.[0]?.price_per_unit || 0,
            tank_capacity: tankCapacity,
            updated_at: new Date().toISOString(),
            fuel_pump_id: fuelPumpId
          });
          
        if (insertError) {
          throw insertError;
        }
        
        console.log(`Created new fuel settings for ${fuelType} with level ${baseQuantity + addedQuantity} liters for fuel pump ${fuelPumpId}`);
      }
      
      // Also update the inventory table with a new entry
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          fuel_type: fuelType,
          quantity: addedQuantity,
          price_per_unit: parseFloat(amount) / addedQuantity, // Calculate price per unit from total amount
          date: currentDate,
          fuel_pump_id: fuelPumpId
        });
        
      if (inventoryError) {
        console.error('Error updating inventory:', inventoryError);
      }
    } catch (error) {
      console.error('Error updating fuel storage:', error);
      // We don't want to throw here so the tank unload still gets recorded
      toast({
        title: "Warning",
        description: "Tank unload recorded, but fuel levels may not have updated correctly",
        variant: "destructive"
      });
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
                <SelectItem value="CNG">CNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="tankerRent">Tanker Rent (in ₹)</Label>
              <Input
                id="tankerRent"
                type="number"
                placeholder="e.g., 5000"
                value={tankerRent}
                onChange={(e) => setTankerRent(e.target.value)}
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
