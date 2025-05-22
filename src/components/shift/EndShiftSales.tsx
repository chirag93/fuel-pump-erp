
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
  indent_sales: number;
  // New field to track testing fuel by type
  testing_fuel_by_type?: Record<string, number>;
}

interface EndShiftSalesProps {
  salesData: SalesFormData;
  onSalesChange: (field: keyof SalesFormData, value: number) => void;
  // Updated type to accept string or number to match useShiftSales implementation
  onTestingFuelByTypeChange?: (fuelType: string | number, value: number) => void;
  totalSales: number;
  totalLiters: number;
  fuelSalesByType?: Record<string, number>;
  fuelRates?: Record<string, number>;
}

// Helper function to safely format numbers
const safeNumberFormat = (value?: number | null, options?: Intl.NumberFormatOptions) => {
  return value !== undefined && value !== null ? 
    value.toLocaleString(undefined, options) : 
    'N/A';
};

export function EndShiftSales({ 
  salesData, 
  onSalesChange,
  onTestingFuelByTypeChange,
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
      
      {/* Testing fuel inputs by fuel type */}
      <div className="border p-4 rounded-md bg-muted/20">
        <Label className="mb-2 block">Testing Fuel By Type (Liters)</Label>
        
        {Object.keys(fuelSalesByType).length > 0 ? (
          <div className="grid gap-3">
            {Object.keys(fuelSalesByType).map(fuelType => (
              <div key={fuelType} className="grid grid-cols-2 gap-2 items-center">
                <span className="text-sm font-medium">{fuelType}:</span>
                <Input
                  type="number"
                  value={(salesData.testing_fuel_by_type?.[fuelType] || 0) === 0 ? '' : salesData.testing_fuel_by_type?.[fuelType]}
                  onChange={(e) => onTestingFuelByTypeChange?.(fuelType, parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="h-8"
                />
              </div>
            ))}
          </div>
        ) : (
          <Input
            id="testing_fuel"
            type="number"
            value={salesData.testing_fuel || ''}
            onChange={(e) => handleInputChange('testing_fuel', e.target.value)}
            placeholder="Total testing fuel (all types)"
          />
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Enter any fuel used for testing purposes that wasn't sold to customers
        </p>
      </div>
      
      {/* Enhanced Sales Summary Card */}
      <Card className="bg-muted/50 mt-2">
        <CardContent className="pt-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Sales:</span>
              <span className="text-lg font-bold">₹{safeNumberFormat(totalSales)}</span>
            </div>
            
            {/* Fuel type breakdown */}
            {Object.keys(fuelSalesByType).length > 0 && (
              <div className="text-sm border-t pt-2 mt-1">
                <div className="grid gap-1">
                  {Object.entries(fuelSalesByType).map(([fuelType, liters]) => {
                    const rate = fuelRates[fuelType] || 0;
                    const calculatedAmount = liters * rate;
                    // Subtract testing fuel from liters if available
                    const testingAmount = salesData.testing_fuel_by_type?.[fuelType] || 0;
                    const actualSoldLiters = Math.max(0, liters - testingAmount);
                    const actualSoldAmount = actualSoldLiters * rate;
                    
                    return (
                      <div key={fuelType} className="grid grid-cols-3">
                        <span className="font-medium">{fuelType}:</span>
                        <span>
                          {safeNumberFormat(actualSoldLiters, {maximumFractionDigits: 2})} L
                          {testingAmount > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (+{testingAmount.toFixed(2)} testing)
                            </span>
                          )}
                        </span>
                        <span className="text-right">₹{safeNumberFormat(actualSoldAmount, {maximumFractionDigits: 2})}</span>
                      </div>
                    );
                  })}
                </div>
                
                {calculatedTotalValue > 0 && (
                  <div className="flex justify-between border-t mt-2 pt-1 font-medium">
                    <span>Calculated Value:</span>
                    <span>₹{safeNumberFormat(calculatedTotalValue, {maximumFractionDigits: 2})}</span>
                  </div>
                )}
                
                {Math.abs(calculatedTotalValue - totalSales) > 1 && calculatedTotalValue > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Difference:</span>
                    <span>₹{safeNumberFormat((calculatedTotalValue - totalSales), {maximumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span>Total Liters:</span>
              <span>{totalLiters?.toFixed(2) || '0.00'} L</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
