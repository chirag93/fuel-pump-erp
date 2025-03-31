
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface FuelSelectorProps {
  fuelType: string;
  setFuelType: (type: string) => void;
}

export const FuelSelector = ({ fuelType, setFuelType }: FuelSelectorProps) => {
  return (
    <div>
      <Label htmlFor="fuelType" className="text-sm font-medium mb-1 block">
        Fuel Type
      </Label>
      <Select
        value={fuelType}
        onValueChange={(value) => setFuelType(value)}
      >
        <SelectTrigger id="fuelType">
          <SelectValue placeholder="Select fuel type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Petrol">Petrol</SelectItem>
          <SelectItem value="Diesel">Diesel</SelectItem>
          <SelectItem value="Premium">Premium Petrol</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
