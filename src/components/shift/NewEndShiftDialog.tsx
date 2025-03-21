
import { useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEndShift } from '@/hooks/useEndShift';
import { EndShiftReadings } from './EndShiftReadings';
import { EndShiftSales } from './EndShiftSales';
import { EndShiftCashExpenses } from './EndShiftCashExpenses';
import { EndShiftConsumables } from './EndShiftConsumables';
import { EndShiftStaff } from './EndShiftStaff';
import { SelectedShiftData } from '@/types/shift';
import { SelectedConsumable } from './ConsumableSelection';

interface EndShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: {
    id: string;
    staff_id: string;
    staff_name: string;
    pump_id: string;
    opening_reading: number;
    shift_type: string;
  };
  onShiftEnded: () => void;
}

export interface SelectedConsumable {
  id: string;
  name: string;
  quantity: number;
  available: number;
  price_per_unit: number;
  unit: string;
}

export function NewEndShiftDialog({ isOpen, onClose, shiftData, onShiftEnded }: EndShiftDialogProps) {
  const {
    formData,
    updateFormData,
    isLoading,
    error,
    staff,
    fuelPrice,
    totalSales,
    allocatedConsumables,
    returnedConsumables,
    updateReturnedConsumable,
    consumablesExpense,
    cashReconciliation,
    handleEndShift,
    testingFuelAmount,
    fuelLiters,
    expectedSalesAmount
  } = useEndShift(isOpen ? shiftData : null, onShiftEnded, onClose);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
          <DialogDescription>
            You are ending {shiftData?.staff_name}'s {shiftData?.shift_type} shift on {shiftData?.pump_id}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <EndShiftReadings
            closingReading={formData.closingReading}
            setClosingReading={(value) => updateFormData('closingReading', value)}
            testingFuel={formData.testingFuel}
            setTestingFuel={(value) => updateFormData('testingFuel', value)}
            openingReading={shiftData?.opening_reading}
            testingFuelAmount={testingFuelAmount}
            fuelLiters={fuelLiters}
            expectedSalesAmount={expectedSalesAmount}
            fuelPrice={fuelPrice}
          />
          
          <EndShiftSales
            cardSales={formData.cardSales}
            setCardSales={(value) => updateFormData('cardSales', value)}
            upiSales={formData.upiSales}
            setUpiSales={(value) => updateFormData('upiSales', value)}
            cashSales={formData.cashSales}
            setCashSales={(value) => updateFormData('cashSales', value)}
            totalSales={totalSales}
            fuelLiters={fuelLiters}
            expectedSalesAmount={expectedSalesAmount}
            testingFuelAmount={testingFuelAmount}
          />
          
          <EndShiftCashExpenses
            expenses={formData.expenses}
            setExpenses={(value) => updateFormData('expenses', value)}
            cashRemaining={formData.cashRemaining}
            setCashRemaining={(value) => updateFormData('cashRemaining', value)}
            cashSales={formData.cashSales}
            cashReconciliation={cashReconciliation}
          />
          
          <EndShiftConsumables
            allocatedConsumables={allocatedConsumables}
            returnedConsumables={returnedConsumables}
            updateReturnedConsumable={updateReturnedConsumable}
            consumablesExpense={consumablesExpense}
          />
          
          <EndShiftStaff
            createNewShift={formData.createNewShift}
            setCreateNewShift={(checked) => updateFormData('createNewShift', checked)}
            selectedStaff={formData.selectedStaff}
            setSelectedStaff={(value) => updateFormData('selectedStaff', value)}
            staff={staff}
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleEndShift} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'End Shift'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
