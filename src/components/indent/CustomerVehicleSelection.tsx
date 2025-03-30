
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { getFuelPumpId } from '@/integrations/utils';

interface CustomerVehicleSelectionProps {
  selectedCustomer: string;
  selectedVehicle: string;
  setSelectedVehicle: (vehicleId: string) => void;
}

export const CustomerVehicleSelection = ({
  selectedCustomer,
  selectedVehicle,
  setSelectedVehicle
}: CustomerVehicleSelectionProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isVehicleLoading, setIsVehicleLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedCustomer) {
      fetchVehicles(selectedCustomer);
    } else {
      setVehicles([]);
    }
  }, [selectedCustomer]);

  const fetchVehicles = async (customerId: string = '') => {
    setIsVehicleLoading(true);
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        console.error('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view vehicles",
          variant: "destructive"
        });
        setIsVehicleLoading(false);
        return;
      }
      
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('number', { ascending: true });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      // Add fuel pump ID filter to ensure data isolation
      query = query.eq('fuel_pump_id', fuelPumpId);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        setVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVehicleLoading(false);
    }
  };

  // If no customer is selected, don't render anything
  if (!selectedCustomer) {
    return null;
  }

  return (
    <div>
      <Label htmlFor="vehicle">Vehicle</Label>
      <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
        <SelectTrigger id="vehicle">
          <SelectValue placeholder="Select a vehicle" />
        </SelectTrigger>
        <SelectContent>
          {isVehicleLoading ? (
            <SelectItem value="loading" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </SelectItem>
          ) : vehicles.length === 0 ? (
            <SelectItem value="no-vehicles" disabled>
              No vehicles found
            </SelectItem>
          ) : (
            vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.number}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
