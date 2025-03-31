
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { VehicleData } from '@/hooks/mobile/useIndentForm';

interface VehicleSelectorProps {
  vehicles: VehicleData[];
  selectedVehicle: string;
  setSelectedVehicle: (id: string) => void;
  setSelectedVehicleNumber: (number: string) => void;
}

export const VehicleSelector = ({ 
  vehicles, 
  selectedVehicle, 
  setSelectedVehicle,
  setSelectedVehicleNumber
}: VehicleSelectorProps) => {
  return (
    <div>
      <Label htmlFor="vehicle" className="text-sm font-medium mb-1 block">
        Vehicle
      </Label>
      <Select
        value={selectedVehicle}
        onValueChange={(value) => {
          setSelectedVehicle(value);
          const selected = vehicles.find(v => v.id === value);
          if (selected) {
            setSelectedVehicleNumber(selected.number);
          }
        }}
      >
        <SelectTrigger id="vehicle">
          <SelectValue placeholder="Select vehicle" />
        </SelectTrigger>
        <SelectContent>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.number} ({vehicle.type})
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No vehicles found
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
