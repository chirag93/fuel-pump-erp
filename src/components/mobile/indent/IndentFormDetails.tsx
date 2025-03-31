
import { VehicleSelector } from './VehicleSelector';
import { FuelSelector } from './FuelSelector';
import { AmountQuantityInputs } from './AmountQuantityInputs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IndentFormDetailsProps {
  indentNumber: string;
  setIndentNumber: (value: string) => void;
  indentNumberError?: string;
  selectedCustomerName: string;
  vehicles: { id: string; number: string }[];
  selectedVehicle: string;
  setSelectedVehicle: (vehicleId: string) => void;
  setSelectedVehicleNumber: (vehicleNumber: string) => void;
  fuelType: string;
  setFuelType: (fuelType: string) => void;
  amount: number | string;
  setAmount: (amount: number | '') => void;
  quantity: number | string;
  setQuantity: (quantity: number | '') => void;
  onFuelPriceChange?: (price: number) => void;
  currentFuelPrice?: number;
}

export const IndentFormDetails = ({
  indentNumber,
  setIndentNumber,
  indentNumberError,
  selectedCustomerName,
  vehicles,
  selectedVehicle,
  setSelectedVehicle,
  setSelectedVehicleNumber,
  fuelType,
  setFuelType,
  amount,
  setAmount,
  quantity,
  setQuantity,
  onFuelPriceChange,
  currentFuelPrice
}: IndentFormDetailsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="indentNumber" className="text-sm font-medium mb-1 block">
          Indent Number
        </Label>
        <Input
          id="indentNumber"
          value={indentNumber}
          onChange={(e) => setIndentNumber(e.target.value)}
          placeholder="Enter indent number"
          className={indentNumberError ? "border-red-500" : ""}
        />
        {indentNumberError && (
          <p className="text-xs text-red-500 mt-1">{indentNumberError}</p>
        )}
      </div>
      
      {selectedCustomerName && (
        <div>
          <Label className="text-sm font-medium mb-1 block">Customer</Label>
          <div className="py-2 px-3 border rounded-md bg-muted/50">
            {selectedCustomerName}
          </div>
        </div>
      )}
      
      <VehicleSelector
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        setSelectedVehicle={setSelectedVehicle}
        setSelectedVehicleNumber={setSelectedVehicleNumber}
      />
      
      <FuelSelector
        fuelType={fuelType}
        setFuelType={setFuelType}
        onFuelPriceChange={onFuelPriceChange}
      />
      
      <AmountQuantityInputs
        amount={amount}
        setAmount={setAmount}
        quantity={quantity}
        setQuantity={setQuantity}
        fuelType={fuelType}
        currentFuelPrice={currentFuelPrice}
      />
    </div>
  );
};
