
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface EndShiftCashExpensesProps {
  expenses: string;
  setExpenses: (value: string) => void;
  cashRemaining: string;
  setCashRemaining: (value: string) => void;
  cashSales: string;
  cashReconciliation: {
    expected: number;
    difference: number;
  };
}

export function EndShiftCashExpenses({
  expenses,
  setExpenses,
  cashRemaining,
  setCashRemaining,
  cashSales,
  cashReconciliation
}: EndShiftCashExpensesProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="expenses">Expenses (₹)</Label>
        <Input
          id="expenses"
          type="number"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
          placeholder="Enter expenses amount"
          min="0"
          step="0.01"
        />
        <p className="text-xs text-muted-foreground">
          Enter any cash expenses that occurred during this shift
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="cashRemaining">Cash Remaining (₹)</Label>
        <Input
          id="cashRemaining"
          type="number"
          value={cashRemaining}
          onChange={(e) => setCashRemaining(e.target.value)}
          placeholder="Enter cash remaining amount"
          min="0"
          step="0.01"
        />
      </div>
      
      {Number(cashSales) > 0 && Number(cashRemaining) > 0 && (
        <Card className={`mt-1 ${Math.abs(cashReconciliation.difference) > 10 ? 'bg-red-50' : 'bg-green-50'}`}>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Cash Reconciliation</span>
            </div>
            <div className="mt-2 text-sm">
              <div className="flex justify-between">
                <span>Expected Cash:</span>
                <span>₹{cashReconciliation.expected.toFixed(2)}</span>
              </div>
              {Number(expenses) > 0 && (
                <div className="flex justify-between">
                  <span>Expenses:</span>
                  <span>₹{Number(expenses).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Actual Cash:</span>
                <span>₹{Number(cashRemaining).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Difference:</span>
                <span className={cashReconciliation.difference < 0 ? 'text-red-600' : 'text-green-600'}>
                  ₹{cashReconciliation.difference.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
