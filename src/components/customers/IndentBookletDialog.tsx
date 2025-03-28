
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createIndentBooklet } from '@/integrations/indentBooklets';
import { IndentBooklet } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface IndentBookletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onSuccess: (booklet: IndentBooklet) => void;
}

export const IndentBookletDialog = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName,
  onSuccess 
}: IndentBookletDialogProps) => {
  const [startNumber, setStartNumber] = useState('');
  const [endNumber, setEndNumber] = useState('');
  const [totalIndents, setTotalIndents] = useState(50); // Default value
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const resetForm = () => {
    setStartNumber('');
    setEndNumber('');
    setTotalIndents(50);
    setIsSubmitting(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startNumber || !endNumber) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const bookletData = {
        customer_id: customerId,
        start_number: startNumber,
        end_number: endNumber,
        total_indents: totalIndents,
        used_indents: 0,
        status: 'Active' as const,
        issued_date: new Date().toISOString()
      };
      
      const newBooklet = await createIndentBooklet(bookletData);
      
      if (newBooklet) {
        onSuccess(newBooklet);
        resetForm();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating booklet:', error);
      toast({
        title: "Error",
        description: "Failed to create indent booklet",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Issue New Indent Booklet</DialogTitle>
            <DialogDescription>
              Create a new indent booklet for {customerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startNumber">Start Number</Label>
                <Input
                  id="startNumber"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  placeholder="e.g. A0001"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endNumber">End Number</Label>
                <Input
                  id="endNumber"
                  value={endNumber}
                  onChange={(e) => setEndNumber(e.target.value)}
                  placeholder="e.g. A0050"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="totalIndents">Total Indents in Booklet</Label>
              <Input
                id="totalIndents"
                type="number"
                value={totalIndents}
                onChange={(e) => setTotalIndents(parseInt(e.target.value))}
                min={1}
                max={1000}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue Booklet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
