
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { SelectedShiftData } from '@/types/shift';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EndShiftReadings } from './EndShiftReadings';
import { EndShiftSales } from './EndShiftSales';
import { EndShiftCashExpenses } from './EndShiftCashExpenses';
import { EndShiftConsumables, AllocatedConsumable, ReturnedConsumablesMap } from './EndShiftConsumables';
import { useEndShiftDialog } from '@/hooks/useEndShiftDialog';
import { ShiftDetailsSection } from './ShiftDetailsSection';
import { ExpensesSection } from './ExpensesSection';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
    error,
    handleReadingChange,
    handleInputChange,
    handleSalesChange,
    handleTestingFuelByTypeChange,
    updateReturnedConsumable,
    handleSubmit
  } = useEndShiftDialog(shiftData, onShiftEnded);
  
  const onSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      onClose();
    }
  };

  // Check if there are consumables allocated to this shift
  const hasAllocatedConsumables = allocatedConsumables && allocatedConsumables.length > 0;

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
            
            {/* Sales Section with fuel rates and indent sales */}
            <EndShiftSales
              salesData={{
                card_sales: formData.card_sales,
                upi_sales: formData.upi_sales,
                cash_sales: formData.cash_sales,
                indent_sales: formData.indent_sales,
                testing_fuel: formData.testing_fuel,
                testing_fuel_by_type: formData.testing_fuel_by_type
              }}
              onSalesChange={handleSalesChange}
              onTestingFuelByTypeChange={handleTestingFuelByTypeChange}
              totalSales={totalSales}
              totalLiters={totalLiters}
              fuelSalesByType={fuelSalesByType}
              fuelRates={fuelRates}
            />
            
            {/* Consumables Section - Make it more visible */}
            {hasAllocatedConsumables ? (
              <div className="border p-4 rounded-md bg-blue-50/30">
                <h3 className="font-semibold text-lg mb-2">Consumables Reconciliation</h3>
                <EndShiftConsumables
                  allocatedConsumables={allocatedConsumables}
                  returnedConsumables={returnedConsumables}
                  updateReturnedConsumable={updateReturnedConsumable}
                  consumablesExpense={consumablesExpense}
                />
              </div>
            ) : (
              <div className="border p-4 rounded-md bg-muted/20">
                <h3 className="font-semibold text-lg mb-2">Consumables Reconciliation</h3>
                <p className="text-muted-foreground text-center py-3">
                  No consumables were allocated for this shift
                </p>
              </div>
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
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : "End Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
