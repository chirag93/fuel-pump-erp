
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';

interface FuelSelectorProps {
  fuelType: string;
  setFuelType: (type: string) => void;
}

export const FuelSelector = ({ fuelType, setFuelType }: FuelSelectorProps) => {
  const [fuelTypes, setFuelTypes] = useState<{type: string, price: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        setIsLoading(true);
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available, using default fuel types');
          setFuelTypes([
            { type: 'Petrol', price: 0 },
            { type: 'Diesel', price: 0 },
            { type: 'Premium', price: 0 }
          ]);
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('fuel_type, current_price')
          .eq('fuel_pump_id', fuelPumpId);
          
        if (error) {
          console.error('Error fetching fuel types:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          const formattedData = data.map(item => ({
            type: item.fuel_type,
            price: item.current_price
          }));
          setFuelTypes(formattedData);
          
          // Set a default fuel type if none is selected and we have data
          if (!fuelType && formattedData.length > 0) {
            setFuelType(formattedData[0].type);
          }
        } else {
          // Fallback to defaults if no data
          const defaults = [
            { type: 'Petrol', price: 0 },
            { type: 'Diesel', price: 0 },
            { type: 'Premium', price: 0 }
          ];
          setFuelTypes(defaults);
          
          // Set a default fuel type if none is selected
          if (!fuelType) {
            setFuelType(defaults[0].type);
          }
        }
      } catch (error) {
        console.error('Error fetching fuel types:', error);
        // Fallback to defaults on error
        setFuelTypes([
          { type: 'Petrol', price: 0 },
          { type: 'Diesel', price: 0 },
          { type: 'Premium', price: 0 }
        ]);
        
        // Set a default fuel type if none is selected
        if (!fuelType) {
          setFuelType('Petrol');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFuelTypes();
  }, [fuelType, setFuelType]);

  return (
    <div>
      <Label htmlFor="fuelType" className="text-sm font-medium mb-1 block">
        Fuel Type
      </Label>
      <Select
        value={fuelType}
        onValueChange={(value) => setFuelType(value)}
        disabled={isLoading}
      >
        <SelectTrigger id="fuelType">
          <SelectValue placeholder="Select fuel type" />
        </SelectTrigger>
        <SelectContent>
          {fuelTypes.map(fuel => (
            <SelectItem key={fuel.type} value={fuel.type}>
              {fuel.type} {fuel.price > 0 ? `(₹${fuel.price}/L)` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
