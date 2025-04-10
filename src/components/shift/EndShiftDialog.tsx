
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEndShiftDialogLogic } from '@/hooks/useEndShiftDialogLogic';
import { EndShiftReadingFields } from './EndShiftReadingFields';
import { EndShiftSalesFields } from './EndShiftSalesFields';
import { EndShiftCashFields } from './EndShiftCashFields';
import { StartNewShiftFields } from './StartNewShiftFields';

interface EndShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  staffId: string;
  pumpId: string;
  openingReading: number;
  onComplete: () => void;
}

const EndShiftDialog = ({ 
  open, 
  onOpenChange, 
  shiftId, 
  staffId, 
  pumpId, 
  openingReading, 
  onComplete 
}: EndShiftDialogProps) => {
  const {
    mode,
    setMode,
    loading,
    error,
    formData,
    totalSales,
    cashReconciliation,
    newShiftData,
    staffList,
    isEditingCompletedShift,
    fuelLiters,
    expectedSalesAmount,
    handleInputChange,
    handleNewShiftInputChange,
    handleStaffChange,
    handleSubmit
  } = useEndShiftDialogLogic(shiftId, staffId, pumpId, openingReading, onComplete);

  const onSubmitHandler = async () => {
    const success = await handleSubmit();
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && !open && onOpenChange(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditingCompletedShift ? "Edit Completed Shift" : "End Shift"}
          </DialogTitle>
          <DialogDescription>
            {isEditingCompletedShift 
              ? "Update the details of this completed shift."
              : "Enter the closing information to end the current shift."}
          </DialogDescription>
        </DialogHeader>
        
        {!isEditingCompletedShift && (
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'end-only' | 'end-and-start')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="end-only">End Shift Only</TabsTrigger>
              <TabsTrigger value="end-and-start">End & Start New</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
          
        <div className="space-y-4 py-2">
          {/* Meter Reading Section */}
          <EndShiftReadingFields
            closingReading={formData.closing_reading}
            openingReading={openingReading}
            handleInputChange={handleInputChange}
            fuelLiters={fuelLiters}
            expectedSalesAmount={expectedSalesAmount}
            isEditingCompletedShift={isEditingCompletedShift}
          />
          
          {/* Sales Section */}
          <EndShiftSalesFields
            formData={formData}
            handleInputChange={handleInputChange}
            totalSales={totalSales}
            fuelLiters={fuelLiters}
            expectedSalesAmount={expectedSalesAmount}
            isEditingCompletedShift={isEditingCompletedShift}
          />
          
          {/* Cash and Expenses Section */}
          <EndShiftCashFields
            formData={formData}
            handleInputChange={handleInputChange}
            cashReconciliation={cashReconciliation}
          />
        </div>
        
        {/* New Shift Section (conditional) */}
        {!isEditingCompletedShift && mode === 'end-and-start' && (
          <TabsContent value="end-and-start" className="space-y-4 mt-4 border-t pt-4">
            <StartNewShiftFields
              newShiftData={newShiftData}
              staffList={staffList}
              handleNewShiftInputChange={handleNewShiftInputChange}
              handleStaffChange={handleStaffChange}
            />
          </TabsContent>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={onSubmitHandler} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isEditingCompletedShift ? 'Update Shift' : 
              mode === 'end-only' ? 'End Shift' : 'End & Start New'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndShiftDialog;
