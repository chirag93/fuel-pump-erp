
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EndShiftReadingFieldsProps {
  closingReading: number;
  openingReading: number;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fuelLiters: number;
  expectedSalesAmount: number;
  isEditingCompletedShift: boolean;
}

export function EndShiftReadingFields({
  closingReading,
  openingReading,
  handleInputChange,
  fuelLiters,
  expectedSalesAmount,
  isEditingCompletedShift
}: EndShiftReadingFieldsProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="closing_reading">Closing Reading</Label>
      <Input
        id="closing_reading"
        name="closing_reading"
        type="number"
        value={closingReading === 0 ? '' : closingReading}
        onChange={handleInputChange}
      />
      {!isEditingCompletedShift && (
        <p className="text-xs text-muted-foreground">
          Current opening reading: {openingReading}
        </p>
      )}
      {closingReading > 0 && openingReading > 0 && !isEditingCompletedShift && (
        <p className="text-xs font-medium text-green-600">
          Fuel sold: {fuelLiters.toFixed(2)} liters 
          {expectedSalesAmount > 0 && ` (₹${expectedSalesAmount.toFixed(2)})`}
        </p>
      )}
    </div>
  );
}
