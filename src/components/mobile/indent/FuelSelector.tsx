
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';

interface FuelSelectorProps {
  fuelType: string;
  setFuelType: (type: string) => void;
  onFuelPriceChange?: (price: number) => void;
  showPrices?: boolean;
}

export const FuelSelector = ({ 
  fuelType, 
  setFuelType, 
  onFuelPriceChange, 
  showPrices = true 
}: FuelSelectorProps) => {
  const [fuelTypes, setFuelTypes] = useState<{type: string, price: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFuelTypes = async () => {
      try {
        setIsLoading(true);
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available, unable to fetch fuel types');
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
            
            // Call the onFuelPriceChange callback with the price of the selected fuel type
            if (onFuelPriceChange) {
              onFuelPriceChange(formattedData[0].price);
            }
          } else if (fuelType && onFuelPriceChange) {
            // If fuel type is already selected, update the price
            const selectedFuel = formattedData.find(fuel => fuel.type === fuelType);
            if (selectedFuel) {
              onFuelPriceChange(selectedFuel.price);
            }
          }
        } else {
          console.warn('No fuel types found in settings');
          setFuelTypes([]);
        }
      } catch (error) {
        console.error('Error fetching fuel types:', error);
        setFuelTypes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFuelTypes();
  }, [fuelType, setFuelType, onFuelPriceChange]);

  const handleFuelTypeChange = (value: string) => {
    setFuelType(value);
    
    // Update the fuel price when the fuel type changes
    if (onFuelPriceChange) {
      const selectedFuel = fuelTypes.find(fuel => fuel.type === value);
      if (selectedFuel) {
        onFuelPriceChange(selectedFuel.price);
      }
    }
  };

  return (
    <div>
      <Label htmlFor="fuelType" className="text-sm font-medium mb-1 block">
        Fuel Type
      </Label>
      <Select
        value={fuelType}
        onValueChange={handleFuelTypeChange}
        disabled={isLoading || fuelTypes.length === 0}
      >
        <SelectTrigger id="fuelType">
          <SelectValue placeholder={isLoading ? "Loading..." : fuelTypes.length === 0 ? "No fuel types available" : "Select fuel type"} />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {fuelTypes.length > 0 ? (
            fuelTypes.map(fuel => (
              <SelectItem key={fuel.type} value={fuel.type}>
                {fuel.type} {showPrices && fuel.price > 0 ? `(₹${fuel.price}/L)` : ''}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-fuel" disabled>
              No fuel types available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
