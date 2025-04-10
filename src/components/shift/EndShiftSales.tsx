
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
  indent_sales: number; // Added indent sales field
}

interface EndShiftSalesProps {
  salesData: SalesFormData;
  onSalesChange: (field: keyof SalesFormData, value: number) => void;
  totalSales: number;
  totalLiters: number;
  fuelSalesByType?: Record<string, number>;
  fuelRates?: Record<string, number>;
}

export function EndShiftSales({ 
  salesData, 
  onSalesChange,
  totalSales,
  totalLiters,
  fuelSalesByType = {},
  fuelRates = {}
}: EndShiftSalesProps) {
  const handleInputChange = (field: keyof SalesFormData, value: string) => {
    onSalesChange(field, parseFloat(value) || 0);
  };

  // Calculate estimated total value based on fuel rates
  const calculatedTotalValue = Object.entries(fuelSalesByType).reduce((total, [fuelType, liters]) => {
    const rate = fuelRates[fuelType] || 0;
    return total + (liters * rate);
  }, 0);

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
      
      {/* Add Indent Sales field */}
      <div>
        <Label htmlFor="indent_sales">Indent Sales (INR)</Label>
        <Input
          id="indent_sales"
          type="number"
          value={salesData.indent_sales || ''}
          onChange={(e) => handleInputChange('indent_sales', e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Pre-filled with your recorded indent transactions during this shift
        </p>
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
      
      {/* Enhanced Sales Summary Card */}
      <Card className="bg-muted/50 mt-2">
        <CardContent className="pt-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Sales:</span>
              <span className="text-lg font-bold">₹{totalSales.toLocaleString()}</span>
            </div>
            
            {/* Fuel type breakdown */}
            {Object.keys(fuelSalesByType).length > 0 && (
              <div className="text-sm border-t pt-2 mt-1">
                <div className="grid gap-1">
                  {Object.entries(fuelSalesByType).map(([fuelType, liters]) => {
                    const rate = fuelRates[fuelType] || 0;
                    const calculatedAmount = liters * rate;
                    
                    return (
                      <div key={fuelType} className="grid grid-cols-3">
                        <span className="font-medium">{fuelType}:</span>
                        <span>{liters.toFixed(2)} L</span>
                        <span className="text-right">₹{calculatedAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                      </div>
                    );
                  })}
                </div>
                
                {calculatedTotalValue > 0 && (
                  <div className="flex justify-between border-t mt-2 pt-1 font-medium">
                    <span>Calculated Value:</span>
                    <span>₹{calculatedTotalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                )}
                
                {Math.abs(calculatedTotalValue - totalSales) > 1 && calculatedTotalValue > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Difference:</span>
                    <span>₹{(calculatedTotalValue - totalSales).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            )}
            
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
