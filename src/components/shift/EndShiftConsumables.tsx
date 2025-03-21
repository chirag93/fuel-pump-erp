
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
  if (allocatedConsumables.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-lg font-medium mb-2">Consumables Used</h3>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {allocatedConsumables.map((item) => {
              const returned = returnedConsumables.find(r => r.id === item.id);
              const used = item.quantity - (returned?.quantity || 0);
              const cost = used * item.price_per_unit;
              
              return (
                <div key={item.id} className="grid gap-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm font-medium text-gray-500">
                      {item.price_per_unit}/per {item.unit}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-blue-600">Allocated: {item.quantity} {item.unit}</span>
                      <span className="mx-2">•</span>
                      <span className="font-medium text-green-600">
                        Return: 
                        <Input
                          type="number"
                          className="ml-2 w-20 h-7 inline-block"
                          value={returned?.quantity || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const newQuantity = isNaN(val) ? 0 : Math.min(val, item.quantity);
                            updateReturnedConsumable(item.id, newQuantity);
                          }}
                          min={0}
                          max={item.quantity}
                        />
                        <span className="ml-1">{item.unit}</span>
                      </span>
                    </div>
                    <div className="font-medium">
                      Used: {used} {item.unit} (₹{cost.toFixed(2)})
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t">
              <div className="flex justify-between font-medium">
                <span>Total Consumables Expense:</span>
                <span>₹{consumablesExpense.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
