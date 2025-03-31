
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleSelector } from './VehicleSelector';
import { FuelSelector } from './FuelSelector';
import { AmountQuantityInputs } from './AmountQuantityInputs';
import { VehicleData } from '@/hooks/mobile/useIndentForm';

interface IndentFormDetailsProps {
  indentNumber: string;
  setIndentNumber: (value: string) => void;
  indentNumberError: string;
  selectedCustomerName: string;
  vehicles: VehicleData[];
  selectedVehicle: string;
  setSelectedVehicle: (id: string) => void;
  setSelectedVehicleNumber: (number: string) => void;
  fuelType: string;
  setFuelType: (type: string) => void;
  amount: number | '';
  setAmount: (value: number | '') => void;
  quantity: number | '';
  setQuantity: (value: number | '') => void;
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
  setQuantity
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
          className={indentNumberError ? "border-red-500" : ""}
          placeholder="Enter indent number"
        />
        {indentNumberError && <p className="text-red-500 text-xs mt-1">{indentNumberError}</p>}
      </div>
      
      <div>
        <Label htmlFor="customerName" className="text-sm font-medium mb-1 block">
          Customer
        </Label>
        <Input
          id="customerName"
          value={selectedCustomerName}
          readOnly
          placeholder="Customer will be selected based on indent number"
        />
      </div>
      
      <VehicleSelector 
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        setSelectedVehicle={setSelectedVehicle}
        setSelectedVehicleNumber={setSelectedVehicleNumber}
      />
      
      <FuelSelector 
        fuelType={fuelType}
        setFuelType={setFuelType}
      />
      
      <AmountQuantityInputs 
        amount={amount}
        setAmount={setAmount}
        quantity={quantity}
        setQuantity={setQuantity}
        fuelType={fuelType}
      />
    </div>
  );
};
