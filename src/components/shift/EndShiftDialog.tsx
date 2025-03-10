
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';

interface Staff {
  id: string;
  name: string;
}

interface EndShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any;
  pumpId: string;
  onShiftEnded: () => void;
}

const EndShiftDialog = ({ open, onOpenChange, shift, pumpId, onShiftEnded }: EndShiftDialogProps) => {
  const [closingReading, setClosingReading] = useState<string>("");
  const [cashRemaining, setCashRemaining] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createNewShift, setCreateNewShift] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaffId, setNewStaffId] = useState<string>("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name');
        
        if (error) throw error;
        if (data) setStaff(data);
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error",
          description: "Failed to load staff data",
          variant: "destructive"
        });
      }
    };

    if (open) {
      fetchStaff();
      setClosingReading("");
      setCashRemaining("");
      setErrors({});
      setCreateNewShift(true);
      setNewStaffId("");
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!closingReading) {
      newErrors.closingReading = "Closing reading is required";
    } else if (isNaN(Number(closingReading)) || Number(closingReading) < 0) {
      newErrors.closingReading = "Please enter a valid reading";
    }
    
    if (!cashRemaining) {
      newErrors.cashRemaining = "Cash remaining is required";
    } else if (isNaN(Number(cashRemaining)) || Number(cashRemaining) < 0) {
      newErrors.cashRemaining = "Please enter a valid amount";
    }
    
    if (createNewShift && !newStaffId) {
      newErrors.newStaffId = "Please select staff for the next shift";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEndShift = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // 1. Find the reading for this shift
      const { data: readingData, error: readingError } = await supabase
        .from('readings')
        .select('*')
        .eq('shift_id', shift.id)
        .eq('pump_id', pumpId);
      
      if (readingError) throw readingError;
      
      if (readingData && readingData.length > 0) {
        const reading = readingData[0];
        
        // 2. Update the reading with closing value
        const { error: updateError } = await supabase
          .from('readings')
          .update({ 
            closing_reading: Number(closingReading),
          })
          .eq('id', reading.id);
        
        if (updateError) throw updateError;
      }
      
      // 3. End the current shift
      const currentDateTime = new Date().toISOString();
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          end_time: currentDateTime,
          status: 'completed',
          cash_remaining: Number(cashRemaining)
        })
        .eq('id', shift.id);
      
      if (shiftError) throw shiftError;
      
      // 4. Create a new shift if requested
      if (createNewShift && newStaffId) {
        // Start a new shift with the selected staff
        const { error: newShiftError } = await supabase
          .from('shifts')
          .insert({
            staff_id: newStaffId,
            shift_type: shift.shift_type,
            start_time: currentDateTime,
            status: 'active'
          });
        
        if (newShiftError) throw newShiftError;
        
        // Create a new reading for the new shift
        const { error: newReadingError } = await supabase
          .from('readings')
          .insert({
            pump_id: pumpId,
            staff_id: newStaffId,
            opening_reading: Number(closingReading),
            date: new Date().toISOString().split('T')[0],
            shift_id: null  // This will be updated after we get the shift ID
          });
        
        if (newReadingError) throw newReadingError;
      }
      
      toast({
        title: "Shift ended successfully",
        description: createNewShift ? "A new shift has been started" : "No new shift was created",
      });
      
      onOpenChange(false);
      onShiftEnded();
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error",
        description: "Failed to end shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
          <DialogDescription>
            Enter the closing meter reading and cash details to end this shift.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="closingReading">Closing Meter Reading</Label>
            <Input
              id="closingReading"
              type="number"
              value={closingReading}
              onChange={(e) => setClosingReading(e.target.value)}
              placeholder="Enter closing reading"
              className={errors.closingReading ? "border-red-500" : ""}
            />
            {errors.closingReading && (
              <p className="text-sm text-red-500">{errors.closingReading}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cashRemaining">Cash Remaining (₹)</Label>
            <Input
              id="cashRemaining"
              type="number"
              value={cashRemaining}
              onChange={(e) => setCashRemaining(e.target.value)}
              placeholder="Enter cash amount"
              className={errors.cashRemaining ? "border-red-500" : ""}
            />
            {errors.cashRemaining && (
              <p className="text-sm text-red-500">{errors.cashRemaining}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="createNewShift" 
              checked={createNewShift}
              onCheckedChange={setCreateNewShift}
            />
            <Label htmlFor="createNewShift">Create new shift immediately</Label>
          </div>
          
          {createNewShift && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="newStaffId">Assign Staff for Next Shift</Label>
              <Select value={newStaffId} onValueChange={setNewStaffId}>
                <SelectTrigger id="newStaffId" className={errors.newStaffId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.newStaffId && (
                <p className="text-sm text-red-500">{errors.newStaffId}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleEndShift} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "End Shift"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndShiftDialog;
