
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [mode, setMode] = useState<'end-only' | 'end-and-start'>('end-only');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    closing_reading: 0,
    cash_remaining: 0,
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0
  });
  
  // New shift data for when starting a new shift after ending current one
  const [newShiftData, setNewShiftData] = useState({
    staff_id: staffId,
    pump_id: pumpId,
    opening_reading: 0, // Will be set to the closing reading of the ending shift
    cash_given: 0,
    date: new Date().toISOString().split('T')[0],
    shift_type: 'day'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  const handleNewShiftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewShiftData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };
  
  const handleShiftTypeChange = (value: string) => {
    setNewShiftData(prev => ({
      ...prev,
      shift_type: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // First end the current shift
      const now = new Date().toISOString();
      
      // Update the shift record
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          end_time: now,
          status: 'completed',
        })
        .eq('id', shiftId);
        
      if (shiftError) {
        throw shiftError;
      }
      
      // Update the readings record
      const { error: readingsError } = await supabase
        .from('readings')
        .update({
          closing_reading: formData.closing_reading,
          cash_remaining: formData.cash_remaining,
          card_sales: formData.card_sales,
          upi_sales: formData.upi_sales,
          cash_sales: formData.cash_sales
        })
        .eq('shift_id', shiftId);
        
      if (readingsError) {
        throw readingsError;
      }
      
      // If we're also starting a new shift
      if (mode === 'end-and-start') {
        // Create a new shift
        const { data: newShift, error: newShiftError } = await supabase
          .from('shifts')
          .insert([{
            staff_id: newShiftData.staff_id,
            shift_type: newShiftData.shift_type,
            start_time: now,
            status: 'active'
          }])
          .select();
          
        if (newShiftError) {
          throw newShiftError;
        }
        
        if (!newShift || newShift.length === 0) {
          throw new Error("Failed to create new shift");
        }
        
        // Create associated reading record
        const { error: newReadingError } = await supabase
          .from('readings')
          .insert([{
            shift_id: newShift[0].id,
            staff_id: newShiftData.staff_id,
            pump_id: newShiftData.pump_id,
            date: newShiftData.date,
            opening_reading: formData.closing_reading, // Use closing reading as opening reading
            cash_given: newShiftData.cash_given
          }]);
          
        if (newReadingError) {
          throw newReadingError;
        }
      }
      
      toast({
        title: "Success",
        description: mode === 'end-only' 
          ? "Shift ended successfully." 
          : "Shift ended and new shift started successfully."
      });
      
      onOpenChange(false);
      onComplete();
    } catch (error) {
      console.error('Error processing shift:', error);
      toast({
        title: "Error",
        description: "Failed to process shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
          <DialogDescription>
            Enter the closing information to end the current shift.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'end-only' | 'end-and-start')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="end-only">End Shift Only</TabsTrigger>
            <TabsTrigger value="end-and-start">End & Start New</TabsTrigger>
          </TabsList>
          
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="closing_reading">Closing Reading</Label>
              <Input
                id="closing_reading"
                name="closing_reading"
                type="number"
                value={formData.closing_reading}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">
                Current opening reading: {openingReading}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="cash_remaining">Cash Remaining</Label>
              <Input
                id="cash_remaining"
                name="cash_remaining"
                type="number"
                value={formData.cash_remaining}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="card_sales">Card Sales</Label>
                <Input
                  id="card_sales"
                  name="card_sales"
                  type="number"
                  value={formData.card_sales}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-1">
                <Label htmlFor="upi_sales">UPI Sales</Label>
                <Input
                  id="upi_sales"
                  name="upi_sales"
                  type="number"
                  value={formData.upi_sales}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-1">
                <Label htmlFor="cash_sales">Cash Sales</Label>
                <Input
                  id="cash_sales"
                  name="cash_sales"
                  type="number"
                  value={formData.cash_sales}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          <TabsContent value="end-and-start" className="space-y-4 mt-4 border-t pt-4">
            <div className="grid gap-2">
              <Label htmlFor="shift_type">New Shift Type</Label>
              <Select 
                value={newShiftData.shift_type}
                onValueChange={handleShiftTypeChange}
              >
                <SelectTrigger id="shift_type">
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6AM-2PM)</SelectItem>
                  <SelectItem value="day">Day (2PM-10PM)</SelectItem>
                  <SelectItem value="night">Night (10PM-6AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="cash_given">New Cash Given</Label>
              <Input
                id="cash_given"
                name="cash_given"
                type="number"
                value={newShiftData.cash_given}
                onChange={handleNewShiftInputChange}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : mode === 'end-only' ? 'End Shift' : 'End & Start New'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndShiftDialog;
