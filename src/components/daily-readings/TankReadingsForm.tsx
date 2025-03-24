
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

interface TankReading {
  tank_number: number;
  dip_reading: number;
  net_stock: number;
}

export interface ReadingFormData {
  id?: string;
  date: string;
  fuel_type: string;
  readings: {
    [key: number]: {
      dip_reading: number;
      net_stock: number;
      tank_number: number;
    }
  };
  receipt_quantity: number;
  closing_stock: number;
  actual_meter_sales: number;
}

interface TankReadingsFormProps {
  readingFormData: ReadingFormData;
  tankCount: number;
  handleTankInputChange: (tankNumber: number, field: string, value: string) => void;
  addTank: () => void;
  removeTank: (tankNumber: number) => void;
  calculatedValues: {
    opening_stock: number;
    sales_per_tank_stock: number;
    stock_variation: number;
  };
}

const TankReadingsForm = ({
  readingFormData,
  tankCount,
  handleTankInputChange,
  addTank,
  removeTank,
  calculatedValues
}: TankReadingsFormProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="border p-3 rounded-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-sm">Tank Readings</h3>
        <Button type="button" variant="outline" size="sm" onClick={addTank}>
          Add Tank
        </Button>
      </div>
      
      {/* Tank readings */}
      {Object.keys(readingFormData.readings).map((tankKey) => {
        const tankNumber = parseInt(tankKey);
        const tank = readingFormData.readings[tankNumber];
        
        return (
          <div key={tankNumber} className="mb-3 border-b pb-3 last:border-b-0 last:pb-0">
            {isMobile ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Tank {tankNumber}</span>
                  {tankCount > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTank(tankNumber)}
                      className="text-red-500 hover:text-red-700 h-6 px-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor={`dip_reading_${tankNumber}`} className="text-xs text-muted-foreground">Dip Reading</Label>
                    <Input
                      type="number"
                      id={`dip_reading_${tankNumber}`}
                      value={tank.dip_reading === 0 && readingFormData.id ? '' : tank.dip_reading}
                      onChange={(e) => handleTankInputChange(tankNumber, 'dip_reading', e.target.value)}
                      placeholder="Enter dip reading"
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`net_stock_${tankNumber}`} className="text-xs text-muted-foreground">Net Stock</Label>
                    <Input
                      type="number"
                      id={`net_stock_${tankNumber}`}
                      value={tank.net_stock === 0 && readingFormData.id ? '' : tank.net_stock}
                      onChange={(e) => handleTankInputChange(tankNumber, 'net_stock', e.target.value)}
                      placeholder="Enter net stock"
                      className="h-9 mt-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-2">
                  <Label>Tank {tankNumber}</Label>
                </div>
                <div className="col-span-4">
                  <Label htmlFor={`dip_reading_${tankNumber}`}>Dip Reading</Label>
                  <Input
                    type="number"
                    id={`dip_reading_${tankNumber}`}
                    value={tank.dip_reading === 0 && readingFormData.id ? '' : tank.dip_reading}
                    onChange={(e) => handleTankInputChange(tankNumber, 'dip_reading', e.target.value)}
                    placeholder="Enter dip reading"
                  />
                </div>
                <div className="col-span-4">
                  <Label htmlFor={`net_stock_${tankNumber}`}>Net Stock</Label>
                  <Input
                    type="number"
                    id={`net_stock_${tankNumber}`}
                    value={tank.net_stock === 0 && readingFormData.id ? '' : tank.net_stock}
                    onChange={(e) => handleTankInputChange(tankNumber, 'net_stock', e.target.value)}
                    placeholder="Enter net stock"
                  />
                </div>
                <div className="col-span-2">
                  {tankCount > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTank(tankNumber)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      <div className="mt-3 p-2 bg-muted rounded-md">
        <div className="flex items-center">
          <span className="font-medium mr-2 text-sm">Opening Stock:</span>
          <span>{calculatedValues.opening_stock}</span>
        </div>
      </div>
    </div>
  );
};

export default TankReadingsForm;
