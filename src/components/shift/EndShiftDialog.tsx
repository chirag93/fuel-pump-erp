
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EndShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  staffId: string;
  pumpId: string;
  openingReading: number;
  onComplete: () => void;
}

const EndShiftDialog = ({ open, onOpenChange, shiftId, staffId, pumpId, openingReading, onComplete }: EndShiftDialogProps) => {
  const [closingReading, setClosingReading] = useState<number>(openingReading + Math.floor(Math.random() * 500));
  const [cashRemaining, setCashRemaining] = useState<number>(Math.floor(Math.random() * 5000));
  const [cardSales, setCardSales] = useState<number>(Math.floor(Math.random() * 15000));
  const [upiSales, setUpiSales] = useState<number>(Math.floor(Math.random() * 12000));
  const [cashSales, setCashSales] = useState<number>(Math.floor(Math.random() * 18000));
  const [nextAction, setNextAction] = useState<'end_only' | 'start_new'>('end_only');
  const [newStaffId, setNewStaffId] = useState<string>(staffId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleEndShift = async () => {
    try {
      setIsSubmitting(true);
      
      // Update the shift record
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', shiftId);
        
      if (shiftError) throw shiftError;
      
      // Update the reading record
      const { error: readingError } = await supabase
        .from('readings')
        .update({
          closing_reading: closingReading,
          cash_remaining: cashRemaining,
          card_sales: cardSales,
          upi_sales: upiSales,
          cash_sales: cashSales
        })
        .eq('shift_id', shiftId);
        
      if (readingError) throw readingError;
      
      toast({
        title: "Success",
        description: "Shift ended successfully"
      });
      
      // Start new shift if selected
      if (nextAction === 'start_new') {
        // Create a new shift record
        const { data: newShiftData, error: newShiftError } = await supabase
          .from('shifts')
          .insert([{
            staff_id: newStaffId,
            shift_type: 'day',
            start_time: new Date().toISOString(),
            status: 'active'
          }])
          .select();
          
        if (newShiftError) throw newShiftError;
        
        if (!newShiftData || newShiftData.length === 0) {
          throw new Error("Failed to create new shift record");
        }
        
        // Create a new reading record
        const { error: newReadingError } = await supabase
          .from('readings')
          .insert([{
            shift_id: newShiftData[0].id,
            staff_id: newStaffId,
            pump_id: pumpId,
            date: new Date().toISOString().split('T')[0],
            opening_reading: closingReading,
            closing_reading: null
          }]);
          
        if (newReadingError) throw newReadingError;
        
        toast({
          title: "Success",
          description: "New shift started successfully"
        });
      }
      
      onComplete();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error",
        description: "Failed to process shift ending. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
          <DialogDescription>
            Enter the closing details to end the current shift.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="closingReading">Closing Meter Reading</Label>
            <Input
              id="closingReading"
              type="number"
              value={closingReading}
              onChange={(e) => setClosingReading(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cardSales">Card Sales (₹)</Label>
              <Input
                id="cardSales"
                type="number"
                value={cardSales}
                onChange={(e) => setCardSales(parseFloat(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="upiSales">UPI Sales (₹)</Label>
              <Input
                id="upiSales"
                type="number"
                value={upiSales}
                onChange={(e) => setUpiSales(parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cashSales">Cash Sales (₹)</Label>
              <Input
                id="cashSales"
                type="number"
                value={cashSales}
                onChange={(e) => setCashSales(parseFloat(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cashRemaining">Cash Remaining (₹)</Label>
              <Input
                id="cashRemaining"
                type="number"
                value={cashRemaining}
                onChange={(e) => setCashRemaining(parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          <div className="grid gap-2 pt-2">
            <Label>After ending this shift</Label>
            <RadioGroup 
              value={nextAction} 
              onValueChange={(value) => setNextAction(value as 'end_only' | 'start_new')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="end_only" id="end_only" />
                <Label htmlFor="end_only" className="cursor-pointer">
                  End shift only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="start_new" id="start_new" />
                <Label htmlFor="start_new" className="cursor-pointer">
                  Start new shift immediately
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {nextAction === 'start_new' && (
            <div className="grid gap-2 border rounded-md p-3 bg-muted/30">
              <Label htmlFor="newStaffId">Staff for new shift</Label>
              <Input
                id="newStaffId"
                value={newStaffId}
                onChange={(e) => setNewStaffId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The new shift will continue with the same pump and start with the closing reading.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleEndShift} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'End Shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndShiftDialog;
