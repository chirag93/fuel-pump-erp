
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectedConsumable } from '@/components/shift/ConsumableSelection';

interface EndShiftConsumablesProps {
  allocatedConsumables: SelectedConsumable[];
  returnedConsumables: SelectedConsumable[];
  updateReturnedConsumable: (id: string, quantity: number) => void;
  consumablesExpense: number;
}

export function EndShiftConsumables({
  allocatedConsumables,
  returnedConsumables,
  updateReturnedConsumable,
  consumablesExpense
}: EndShiftConsumablesProps) {
  // Only render this component if there are allocated consumables
  if (!allocatedConsumables || allocatedConsumables.length === 0) {
    return (
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-2">Consumables Reconciliation</h3>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No consumables were allocated for this shift.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-lg font-medium mb-2">Consumables Reconciliation</h3>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {allocatedConsumables.map((item) => {
              const returned = returnedConsumables.find(r => r.id === item.id);
              const sold = item.quantity - (returned?.quantity || 0);
              const revenue = sold * item.price_per_unit;
              
              return (
                <div key={item.id} className="grid gap-3 pb-4 border-b last:border-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-base">{item.name}</p>
                    <p className="text-sm font-medium text-gray-500">
                      ₹{item.price_per_unit}/per {item.unit}
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm text-muted-foreground">Allocated:</span>
                      <span className="font-medium text-blue-600">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm text-muted-foreground">Return:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          className="w-24 h-9"
                          value={returned?.quantity || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const newQuantity = isNaN(val) ? 0 : Math.min(val, item.quantity);
                            updateReturnedConsumable(item.id, newQuantity);
                          }}
                          min={0}
                          max={item.quantity}
                        />
                        <span className="text-sm font-medium">{item.unit}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t pt-3 mt-1">
                    <span className="text-sm text-muted-foreground">Sold:</span>
                    <span className="font-medium text-green-600">
                      {sold} {item.unit} (₹{revenue.toFixed(2)})
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
    </div>
  );
}
