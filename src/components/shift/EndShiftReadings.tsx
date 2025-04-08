
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
  error?: boolean;
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
  fuelPrice,
  error = false
}: EndShiftReadingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const handleClosingReadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setClosingReading(value);
    }
  };
  
  const handleTestingFuelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTestingFuel(value);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="closingReading" className={error ? 'text-destructive' : ''}>
              Closing Reading
            </Label>
            <span className="text-xs text-muted-foreground">
              Opening: {openingReading.toLocaleString()}
            </span>
          </div>
          <Input
            id="closingReading"
            value={closingReading}
            onChange={handleClosingReadingChange}
            placeholder="Enter closing reading"
            type="number"
            min={openingReading}
            className={error ? 'border-destructive' : ''}
          />
          {error && (
            <p className="text-xs text-destructive">
              Closing reading must be greater than opening reading ({openingReading})
            </p>
          )}
        </div>
        
        {Number(closingReading) > 0 && openingReading > 0 && (
          <div className="text-sm">
            <div className="flex justify-between items-center mb-1">
              <span>Total meters sold:</span>
              <span className="font-medium">{(Number(closingReading) - openingReading).toFixed(2)}</span>
            </div>
            
            <div className="flex items-center mb-2">
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-primary underline hover:text-primary/80"
              >
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>
            </div>
            
            {showAdvanced && (
              <div className="pl-3 border-l-2 border-muted py-2 space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="testingFuel" className="text-sm">Testing Fuel (liters)</Label>
                  <Input
                    id="testingFuel"
                    value={testingFuel}
                    onChange={handleTestingFuelChange}
                    placeholder="0"
                    type="number"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the amount of fuel used for testing
                  </p>
                </div>
              </div>
            )}
            
            {/* Results section */}
            <div className="bg-muted/50 p-3 rounded-md mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Testing fuel:</span>
                <span>{testingFuelAmount.toFixed(2)} liters</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sales fuel:</span>
                <span className="font-medium">{fuelLiters.toFixed(2)} liters</span>
              </div>
              {fuelPrice > 0 && (
                <div className="flex justify-between text-sm border-t border-muted pt-1 mt-1">
                  <span>Expected sales amount:</span>
                  <span className="font-medium">₹{expectedSalesAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
