
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
  error?: boolean;
}

export function EndShiftCashExpenses({
  expenses,
  setExpenses,
  cashRemaining,
  setCashRemaining,
  cashSales,
  cashReconciliation,
  error = false
}: EndShiftCashExpensesProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Cash Reconciliation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="expenses">Expenses</Label>
          <Input
            id="expenses"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            placeholder="0"
            type="number"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Enter any cash expenses that occurred during this shift
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="cashRemaining" className={error ? 'text-destructive' : ''}>
            Cash Remaining
          </Label>
          <Input
            id="cashRemaining"
            value={cashRemaining}
            onChange={(e) => setCashRemaining(e.target.value)}
            placeholder="0"
            type="number"
            min="0"
            className={error ? 'border-destructive' : ''}
          />
          {error && (
            <p className="text-xs text-destructive">
              Please enter a valid cash remaining amount
            </p>
          )}
        </div>
        
        {Number(cashSales) > 0 && Number(cashRemaining) > 0 && (
          <div className={`p-3 rounded-md mt-1 ${Math.abs(cashReconciliation.difference) > 10 ? 'bg-red-50' : 'bg-green-50'}`}>
            <h4 className="font-medium text-sm mb-2">Cash Reconciliation</h4>
            <div className="space-y-1 text-sm">
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
              <div className="flex justify-between font-medium pt-1 border-t border-gray-200 mt-1">
                <span>Difference:</span>
                <span className={cashReconciliation.difference < 0 ? 'text-red-600' : 'text-green-600'}>
                  ₹{cashReconciliation.difference.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
