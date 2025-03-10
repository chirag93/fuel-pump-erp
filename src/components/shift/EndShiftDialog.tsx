
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EndShiftDialogProps {
  shift: {
    id: string;
    staff_id: string;
    readings?: {
      id: string;
      opening_reading: number;
      pump_id: string;
    };
  };
  onShiftEnded: () => void;
}

const EndShiftDialog = ({ shift, onShiftEnded }: EndShiftDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [closingReading, setClosingReading] = useState<number | ''>('');
  const [cashRemaining, setCashRemaining] = useState<number | ''>('');
  
  const handleEndShift = async () => {
    if (!closingReading) {
      toast({
        title: "Required field",
        description: "Please enter the closing reading",
        variant: "destructive"
      });
      return;
    }
    
    if (!cashRemaining && cashRemaining !== 0) {
      toast({
        title: "Required field",
        description: "Please enter the cash remaining",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update the shift record
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ 
          end_time: new Date().toISOString(),
          status: 'completed',
          cash_remaining: cashRemaining 
        })
        .eq('id', shift.id);
      
      if (shiftError) throw shiftError;
      
      // Update the reading record if it exists
      if (shift.readings) {
        const { error: readingError } = await supabase
          .from('readings')
          .update({ closing_reading: closingReading })
          .eq('id', shift.readings.id);
          
        if (readingError) throw readingError;
      }
      
      toast({
        title: "Shift ended",
        description: "Shift has been successfully closed."
      });
      
      setIsOpen(false);
      onShiftEnded();
      
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error",
        description: "Failed to end shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">End Shift</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
          <DialogDescription>
            Enter the closing information to end the current shift.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shift.readings && (
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="openingReading">Opening Reading</Label>
              <Input 
                id="openingReading" 
                value={shift.readings.opening_reading} 
                disabled 
                className="bg-muted"
              />
            </div>
          )}
          
          {shift.readings && (
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="closingReading" className="text-right">
                Closing Reading*
              </Label>
              <Input
                id="closingReading"
                type="number"
                step="0.01"
                min={shift.readings.opening_reading}
                value={closingReading}
                onChange={(e) => setClosingReading(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="cashRemaining" className="text-right">
              Cash Remaining*
            </Label>
            <Input
              id="cashRemaining"
              type="number"
              step="0.01"
              min="0"
              value={cashRemaining}
              onChange={(e) => setCashRemaining(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleEndShift} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'End Shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndShiftDialog;
