
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface FuelReading {
  fuel_type: string;
  opening_reading: number;
  closing_reading: number;
}

interface EndShiftReadingsProps {
  readings: FuelReading[];
  onReadingChange: (fuelType: string, value: number) => void;
}

export function EndShiftReadings({ readings, onReadingChange }: EndShiftReadingsProps) {
  return (
    <div className="grid gap-4">
      <h3 className="font-semibold">Meter Readings</h3>
      {readings.map((reading) => {
        const dispensedAmount = Math.max(0, reading.closing_reading - reading.opening_reading);
        
        return (
          <div key={reading.fuel_type} className="grid gap-2">
            <Label>{reading.fuel_type}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Opening Reading</p>
                <Input value={reading.opening_reading} disabled />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Closing Reading</p>
                <Input
                  type="number"
                  value={reading.closing_reading || ''}
                  onChange={(e) => onReadingChange(reading.fuel_type, parseFloat(e.target.value) || reading.opening_reading)}
                  min={reading.opening_reading}
                />
              </div>
            </div>
            <p className="text-xs text-right">
              Total: {dispensedAmount.toFixed(2)} liters
            </p>
          </div>
        );
      })}
    </div>
  );
}
