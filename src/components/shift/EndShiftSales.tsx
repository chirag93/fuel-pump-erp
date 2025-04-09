
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

// Define the interface explicitly to avoid deep type instantiation
export interface SalesFormData {
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
  const handleInputChange = (field: keyof SalesFormData, value: string) => {
    onSalesChange(field, parseFloat(value) || 0);
  };

  return (
    <div className="grid gap-4">
      <h3 className="font-semibold">Sales Details</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="card_sales">Card Sales (INR)</Label>
          <Input
            id="card_sales"
            type="number"
            value={salesData.card_sales || ''}
            onChange={(e) => handleInputChange('card_sales', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="upi_sales">UPI Sales (INR)</Label>
          <Input
            id="upi_sales"
            type="number"
            value={salesData.upi_sales || ''}
            onChange={(e) => handleInputChange('upi_sales', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cash_sales">Cash Sales (INR)</Label>
          <Input
            id="cash_sales"
            type="number"
            value={salesData.cash_sales || ''}
            onChange={(e) => handleInputChange('cash_sales', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="testing_fuel">Testing Fuel (Liters)</Label>
        <Input
          id="testing_fuel"
          type="number"
          value={salesData.testing_fuel || ''}
          onChange={(e) => handleInputChange('testing_fuel', e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter any fuel used for testing purposes that wasn't sold to customers
        </p>
      </div>
      
      {/* Sales Summary Card */}
      <Card className="bg-muted/50 mt-2">
        <CardContent className="pt-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Sales:</span>
              <span className="text-lg font-bold">₹{totalSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Liters:</span>
              <span>{totalLiters.toFixed(2)} L</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
