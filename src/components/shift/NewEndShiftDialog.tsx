
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { SelectedShiftData } from '@/types/shift';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EndShiftReadings } from './EndShiftReadings';
import { EndShiftSales } from './EndShiftSales';
import { EndShiftCashExpenses } from './EndShiftCashExpenses';
import { EndShiftConsumables } from './EndShiftConsumables';
import { useEndShiftDialog } from '@/hooks/useEndShiftDialog';
import { ShiftDetailsSection } from './ShiftDetailsSection';
import { ExpensesSection } from './ExpensesSection';

interface NewEndShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: SelectedShiftData;
  onShiftEnded: () => void;
}

export function NewEndShiftDialog({
  isOpen,
  onClose,
  shiftData,
  onShiftEnded
}: NewEndShiftDialogProps) {
  const {
    formData,
    isProcessing,
    totalSales,
    totalLiters,
    fuelSalesByType,
    fuelRates,
    cashReconciliation,
    allocatedConsumables,
    returnedConsumables,
    consumablesExpense,
    handleReadingChange,
    handleInputChange,
    handleSalesChange,
    updateReturnedConsumable,
    handleSubmit
  } = useEndShiftDialog(shiftData, onShiftEnded);

  const onSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(80vh-120px)]">
          <div className="grid gap-6 py-4 pr-4">
            <ShiftDetailsSection shiftData={shiftData} />
            
            {/* Readings Section */}
            {formData.readings.length > 0 ? (
              <EndShiftReadings 
                readings={formData.readings}
                onReadingChange={handleReadingChange}
              />
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground">No meter readings available for this shift</p>
              </div>
            )}
            
            {/* Sales Section with fuel rates */}
            <EndShiftSales
              salesData={{
                card_sales: formData.card_sales,
                upi_sales: formData.upi_sales,
                cash_sales: formData.cash_sales,
                testing_fuel: formData.testing_fuel
              }}
              onSalesChange={handleSalesChange}
              totalSales={totalSales}
              totalLiters={totalLiters}
              fuelSalesByType={fuelSalesByType}
              fuelRates={fuelRates}
            />
            
            {/* Consumables Section */}
            {allocatedConsumables.length > 0 && (
              <EndShiftConsumables
                allocatedConsumables={allocatedConsumables}
                returnedConsumables={returnedConsumables}
                updateReturnedConsumable={updateReturnedConsumable}
                consumablesExpense={consumablesExpense}
              />
            )}
            
            {/* Expenses Section */}
            <ExpensesSection 
              expenses={formData.expenses} 
              consumableExpenses={formData.consumable_expenses}
              onExpensesChange={(value) => handleInputChange('expenses', value)}
            />
            
            {/* Cash Section */}
            <EndShiftCashExpenses
              expenses={formData.expenses.toString()}
              setExpenses={(value) => handleInputChange('expenses', parseFloat(value) || 0)}
              cashRemaining={formData.cash_remaining.toString()}
              setCashRemaining={(value) => handleInputChange('cash_remaining', parseFloat(value) || 0)}
              cashSales={formData.cash_sales.toString()}
              cashReconciliation={cashReconciliation}
            />
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "End Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
