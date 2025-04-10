
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExpensesSectionProps {
  expenses: number;
  consumableExpenses: number;
  onExpensesChange: (value: number) => void;
}

export function ExpensesSection({ 
  expenses, 
  consumableExpenses, 
  onExpensesChange 
}: ExpensesSectionProps) {
  return (
    <div className="grid gap-4">
      <h3 className="font-semibold">Expenses</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expenses">Expenses (INR)</Label>
          <Input
            id="expenses"
            type="number"
            value={expenses || ''}
            onChange={(e) => onExpensesChange(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="consumable_expenses">Consumable Sales (INR)</Label>
          <Input
            id="consumable_expenses"
            type="number"
            value={consumableExpenses}
            readOnly
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Calculated from consumable reconciliation
          </p>
        </div>
      </div>
    </div>
  );
}
