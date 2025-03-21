
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface EndShiftReadingsProps {
  closingReading: string;
  setClosingReading: (value: string) => void;
  testingFuel: string;
  setTestingFuel: (value: string) => void;
  openingReading: number;
  testingFuelAmount: number;
  fuelLiters: number;
  expectedSalesAmount: number;
  fuelPrice: number;
}

export function EndShiftReadings({
  closingReading,
  setClosingReading,
  testingFuel,
  setTestingFuel,
  openingReading,
  testingFuelAmount,
  fuelLiters,
  expectedSalesAmount,
  fuelPrice
}: EndShiftReadingsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="closingReading">Closing Reading</Label>
        <Input
          id="closingReading"
          type="number"
          value={closingReading}
          onChange={(e) => setClosingReading(e.target.value)}
          placeholder="Enter closing reading"
          min={openingReading + 1 || 0}
          step="0.01"
        />
        <p className="text-xs text-muted-foreground">
          Opening reading: {openingReading || 0}
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="testingFuel">Testing Fuel Quantity</Label>
        <Input
          id="testingFuel"
          type="number"
          value={testingFuel}
          onChange={(e) => setTestingFuel(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
        <p className="text-xs text-muted-foreground">
          Enter quantity of fuel used for testing (will be deducted from sales)
        </p>
      </div>
      
      {Number(closingReading) > 0 && openingReading > 0 && (
        <div className="grid gap-1">
          <p className="text-xs font-medium text-green-600">
            Total fuel dispensed: {(Number(closingReading) - openingReading).toFixed(2)} liters
          </p>
          {testingFuelAmount > 0 && (
            <p className="text-xs font-medium text-amber-600">
              Testing fuel: {testingFuelAmount.toFixed(2)} liters
            </p>
          )}
          <p className="text-xs font-medium text-blue-600">
            Fuel sold: {fuelLiters.toFixed(2)} liters
            {fuelPrice > 0 && ` (₹${expectedSalesAmount.toFixed(2)})`}
          </p>
        </div>
      )}
    </>
  );
}
