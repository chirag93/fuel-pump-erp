
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface SalesFormData {
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  testing_fuel: number;
}

interface EndShiftSalesProps {
  salesData: SalesFormData;
  onSalesChange: (field: keyof SalesFormData, value: number) => void;
  totalSales: number;
  totalLiters: number;
}

export function EndShiftSales({ 
  salesData, 
  onSalesChange, 
  totalSales,
  totalLiters
}: EndShiftSalesProps) {
  return (
    <div className="grid gap-4">
      <h3 className="font-semibold">Sales</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="card_sales">Card Sales (INR)</Label>
          <Input
            id="card_sales"
            type="number"
            value={salesData.card_sales || ''}
            onChange={(e) => onSalesChange('card_sales', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="upi_sales">UPI Sales (INR)</Label>
          <Input
            id="upi_sales"
            type="number"
            value={salesData.upi_sales || ''}
            onChange={(e) => onSalesChange('upi_sales', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cash_sales">Cash Sales (INR)</Label>
          <Input
            id="cash_sales"
            type="number"
            value={salesData.cash_sales || ''}
            onChange={(e) => onSalesChange('cash_sales', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="testing_fuel">Testing Fuel (liters)</Label>
          <Input
            id="testing_fuel"
            type="number"
            value={salesData.testing_fuel || ''}
            onChange={(e) => onSalesChange('testing_fuel', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      
      {/* Total Sales Summary Card */}
      <Card className="mt-4 bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Sales:</span>
            <span className="text-lg font-bold">₹{totalSales.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm">
            <div className="flex justify-between">
              <span>Card:</span>
              <span>₹{salesData.card_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>UPI:</span>
              <span>₹{salesData.upi_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash:</span>
              <span>₹{salesData.cash_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1 pt-1 border-t">
              <span>Total Liters:</span>
              <span>{totalLiters.toFixed(2)} L</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
