
import { ShiftFormData } from '@/hooks/useEndShiftDialogLogic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface EndShiftSalesFieldsProps {
  formData: ShiftFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalSales: number;
  fuelLiters: number;
  expectedSalesAmount: number;
  isEditingCompletedShift: boolean;
}

export function EndShiftSalesFields({
  formData,
  handleInputChange,
  totalSales,
  fuelLiters,
  expectedSalesAmount,
  isEditingCompletedShift
}: EndShiftSalesFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1">
          <Label htmlFor="card_sales">Card Sales</Label>
          <Input
            id="card_sales"
            name="card_sales"
            type="number"
            value={formData.card_sales === 0 ? '' : formData.card_sales}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="grid gap-1">
          <Label htmlFor="upi_sales">UPI Sales</Label>
          <Input
            id="upi_sales"
            name="upi_sales"
            type="number"
            value={formData.upi_sales === 0 ? '' : formData.upi_sales}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="grid gap-1">
          <Label htmlFor="cash_sales">Cash Sales</Label>
          <Input
            id="cash_sales"
            name="cash_sales"
            type="number"
            value={formData.cash_sales === 0 ? '' : formData.cash_sales}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      {/* Add Indent Sales field */}
      <div className="grid gap-1">
        <Label htmlFor="indent_sales">Indent Sales</Label>
        <Input
          id="indent_sales"
          name="indent_sales"
          type="number"
          value={formData.indent_sales === 0 ? '' : formData.indent_sales}
          onChange={handleInputChange}
        />
        <p className="text-xs text-muted-foreground">
          Pre-filled with your recorded indent transactions during this shift
        </p>
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
              <span>₹{formData.card_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>UPI:</span>
              <span>₹{formData.upi_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash:</span>
              <span>₹{formData.cash_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Indent:</span>
              <span>₹{formData.indent_sales.toLocaleString()}</span>
            </div>
            {!isEditingCompletedShift && (
              <>
                <div className="flex justify-between mt-1 pt-1 border-t">
                  <span>Fuel Sold:</span>
                  <span>{fuelLiters.toFixed(2)} L</span>
                </div>
                {expectedSalesAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Expected Amount:</span>
                    <span>₹{expectedSalesAmount.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
