
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Customer, Vehicle } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface CustomerVehicleSelectionProps {
  selectedCustomer: string;
  setSelectedCustomer: (customerId: string) => void;
  selectedVehicle: string;
  setSelectedVehicle: (vehicleId: string) => void;
}

export const CustomerVehicleSelection = ({
  selectedCustomer,
  setSelectedCustomer,
  selectedVehicle,
  setSelectedVehicle
}: CustomerVehicleSelectionProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState<boolean>(true);
  const [isVehicleLoading, setIsVehicleLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchVehicles(selectedCustomer);
    } else {
      setVehicles([]);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    setIsCustomerLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const fetchVehicles = async (customerId: string = '') => {
    setIsVehicleLoading(true);
    try {
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('number', { ascending: true });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="customer">Customer</Label>
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger id="customer">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {isCustomerLoading ? (
              <SelectItem value="loading" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </SelectItem>
            ) : (
              customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
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
    </div>
  );
};
