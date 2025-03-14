
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TankUnload = () => {
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [quantity, setQuantity] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!vehicleNumber || !fuelType || !quantity || !amount || !date) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Generate a UUID for the transaction
      const unloadId = crypto.randomUUID();
      
      // Create a tank unload record
      const { error } = await supabase
        .from('tank_unloads')
        .insert({
          id: unloadId,
          vehicle_number: vehicleNumber,
          fuel_type: fuelType,
          quantity: quantity,
          amount: amount,
          date: date.toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Tank unload recorded successfully"
      });
      
      // Reset form fields
      setVehicleNumber('');
      setFuelType('Petrol');
      setQuantity(0);
      setAmount(0);
      setDate(new Date());
    } catch (error) {
      console.error('Error recording tank unload:', error);
      toast({
        title: "Error",
        description: "Failed to record tank unload. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tank Unload</h1>
      <p className="text-muted-foreground">
        Record details of incoming fuel tank unloads
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Record Tank Unload</CardTitle>
          <CardDescription>
            Enter details of the fuel unloading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Tanker Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Enter vehicle number"
                />
              </div>
              
              <div className="z-10 space-y-2">
                <Label htmlFor="date">Unload Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (Liters)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity in liters"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount in rupees"
                />
              </div>
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Truck className="mr-2 h-4 w-4" />
                  Record Tank Unload
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Tank Unloads</CardTitle>
          <CardDescription>
            History of recent fuel unloading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 font-medium">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Vehicle Number</th>
                  <th className="py-3 px-4 text-left">Fuel Type</th>
                  <th className="py-3 px-4 text-right">Quantity (L)</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* We'll replace this with actual data later */}
                <tr className="hover:bg-muted/50">
                  <td className="py-3 px-4">Loading...</td>
                  <td className="py-3 px-4">Loading...</td>
                  <td className="py-3 px-4">Loading...</td>
                  <td className="py-3 px-4 text-right">Loading...</td>
                  <td className="py-3 px-4 text-right">Loading...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TankUnload;
