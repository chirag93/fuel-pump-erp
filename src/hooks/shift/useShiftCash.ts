
import { useState, useEffect } from 'react';
import { CashReconciliation } from '@/types/shift-hooks';

export function useShiftCash(
  cashSales: number, 
  cashRemaining: number, 
  expenses: number
) {
  const [cashReconciliation, setCashReconciliation] = useState<CashReconciliation>({
    expected: 0,
    difference: 0
  });

  // Calculate cash reconciliation whenever inputs change
  useEffect(() => {
    const expected = cashSales;
    const difference = cashRemaining - expected + expenses;
    
    setCashReconciliation({
      expected,
      difference
    });
  }, [cashSales, cashRemaining, expenses]);

  return {
    cashReconciliation
  };
}
