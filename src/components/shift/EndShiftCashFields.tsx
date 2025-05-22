
import { ShiftFormData, CashReconciliation } from '@/hooks/useEndShiftDialogLogic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface EndShiftCashFieldsProps {
  formData: ShiftFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cashReconciliation: CashReconciliation;
}

export function EndShiftCashFields({
  formData,
  handleInputChange,
  cashReconciliation
}: EndShiftCashFieldsProps) {
  return (
    <>
      {/* Add Expenses field */}
      <div className="grid gap-2">
        <Label htmlFor="expenses">Expenses</Label>
        <Input
          id="expenses"
          name="expenses"
          type="number"
          value={formData.expenses}
          onChange={handleInputChange}
          placeholder="Enter expenses amount"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <p className="text-xs text-muted-foreground">
          Enter any cash expenses that occurred during this shift
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="cash_remaining">Cash Remaining</Label>
        <Input
          id="cash_remaining"
          name="cash_remaining"
          type="number"
          value={formData.cash_remaining}
          onChange={handleInputChange}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </div>
      
      {/* Cash Reconciliation */}
      {(formData.cash_sales > 0 || formData.cash_remaining > 0) && (
        <Card className={`mt-1 ${Math.abs(cashReconciliation.difference) > 10 ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Cash Reconciliation</span>
            </div>
            <div className="mt-2 text-sm">
              <div className="flex justify-between">
                <span>Expected Cash:</span>
                <span>₹{cashReconciliation.expected.toFixed(2)}</span>
              </div>
              {formData.expenses > 0 && (
                <div className="flex justify-between">
                  <span>Expenses:</span>
                  <span>₹{formData.expenses.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Actual Cash:</span>
                <span>₹{formData.cash_remaining.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Difference:</span>
                <span className={cashReconciliation.difference < 0 ? 'text-red-600' : 'text-green-600'}>
                  ₹{cashReconciliation.difference.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
