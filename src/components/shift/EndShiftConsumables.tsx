
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Define AllocatedConsumable type to match what we're receiving
export interface AllocatedConsumable {
  id: string;
  name: string;
  quantity_allocated: number;
  quantity_returned?: number | null;
  price_per_unit?: number;
  unit?: string;
}

// Interface for returned consumables
export interface ReturnedConsumablesMap {
  [key: string]: number;
}

interface EndShiftConsumablesProps {
  allocatedConsumables: AllocatedConsumable[];
  returnedConsumables: ReturnedConsumablesMap;
  updateReturnedConsumable: (id: string, quantity: number) => void;
  consumablesExpense: number;
}

export function EndShiftConsumables({
  allocatedConsumables,
  returnedConsumables,
  updateReturnedConsumable,
  consumablesExpense
}: EndShiftConsumablesProps) {
  // Only render the detailed component if there are allocated consumables
  if (!allocatedConsumables || allocatedConsumables.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="space-y-5">
          {allocatedConsumables.map((item) => {
            const returnedQuantity = returnedConsumables[item.id] || 0;
            const sold = item.quantity_allocated - returnedQuantity;
            const unitPrice = item.price_per_unit || 0;
            const revenue = sold * unitPrice;
            const itemUnit = item.unit || 'unit';
            
            return (
              <div key={item.id} className="grid gap-3 pb-4 border-b last:border-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-base">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Price: ₹{unitPrice}/per {itemUnit}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    {item.quantity_allocated} {itemUnit} allocated
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">Allocated:</span>
                    <span className="font-medium text-blue-600">
                      {item.quantity_allocated} {itemUnit}
                    </span>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">Return:</span>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        className="w-24 h-9"
                        value={returnedQuantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const newQuantity = isNaN(val) ? 0 : Math.min(val, item.quantity_allocated);
                          updateReturnedConsumable(item.id, newQuantity);
                        }}
                        min={0}
                        max={item.quantity_allocated}
                      />
                      <span className="text-sm font-medium">{itemUnit}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3 mt-1">
                  <span className="text-sm font-medium">Sold:</span>
                  <span className="font-medium text-green-600">
                    {sold} {itemUnit} (₹{revenue.toFixed(2)})
                  </span>
                </div>
              </div>
            );
          })}
          
          <div className="pt-3 border-t">
            <div className="flex justify-between font-medium">
              <span>Total Consumables Sold:</span>
              <span className="text-green-600">₹{consumablesExpense.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
