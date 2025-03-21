
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface EndShiftSalesProps {
  cardSales: string;
  setCardSales: (value: string) => void;
  upiSales: string;
  setUpiSales: (value: string) => void;
  cashSales: string;
  setCashSales: (value: string) => void;
  totalSales: number;
  fuelLiters: number;
  expectedSalesAmount: number;
  testingFuelAmount: number;
}

export function EndShiftSales({
  cardSales,
  setCardSales,
  upiSales,
  setUpiSales,
  cashSales,
  setCashSales,
  totalSales,
  fuelLiters,
  expectedSalesAmount,
  testingFuelAmount
}: EndShiftSalesProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1">
          <Label htmlFor="cardSales">Card Sales (₹)</Label>
          <Input
            id="cardSales"
            type="number"
            value={cardSales}
            onChange={(e) => setCardSales(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
        
        <div className="grid gap-1">
          <Label htmlFor="upiSales">UPI Sales (₹)</Label>
          <Input
            id="upiSales"
            type="number"
            value={upiSales}
            onChange={(e) => setUpiSales(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
        
        <div className="grid gap-1">
          <Label htmlFor="cashSales">Cash Sales (₹)</Label>
          <Input
            id="cashSales"
            type="number"
            value={cashSales}
            onChange={(e) => setCashSales(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>
      
      <Card className="mt-2 bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Sales:</span>
            <span className="text-lg font-bold">₹{totalSales.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm">
            <div className="flex justify-between">
              <span>Card:</span>
              <span>₹{Number(cardSales).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>UPI:</span>
              <span>₹{Number(upiSales).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash:</span>
              <span>₹{Number(cashSales).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1 pt-1 border-t">
              <span>Fuel Sold:</span>
              <span>{fuelLiters.toFixed(2)} L</span>
            </div>
            {testingFuelAmount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Testing Fuel:</span>
                <span>{testingFuelAmount.toFixed(2)} L</span>
              </div>
            )}
            {expectedSalesAmount > 0 && (
              <div className="flex justify-between">
                <span>Expected Amount:</span>
                <span>₹{expectedSalesAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
