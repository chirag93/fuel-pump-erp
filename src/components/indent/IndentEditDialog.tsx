
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase, Indent, Transaction } from '@/integrations/supabase/client';
import BillPreviewDialog from './BillPreviewDialog';

interface IndentWithTransaction extends Indent {
  transaction?: Transaction;
  vehicle_number?: string;
}

interface IndentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indent: IndentWithTransaction;
  onUpdate: () => void;
}

export const IndentEditDialog = ({
  open,
  onOpenChange,
  indent,
  onUpdate
}: IndentEditDialogProps) => {
  const [fuelType, setFuelType] = useState(indent.fuel_type);
  const [amount, setAmount] = useState(indent.amount);
  const [quantity, setQuantity] = useState(indent.quantity);
  const [status, setStatus] = useState(indent.status || 'Pending');
  const [date, setDate] = useState<Date | undefined>(indent.date ? new Date(indent.date) : undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerName, setCustomerName] = useState<string>('');
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  useEffect(() => {
    if (open && indent) {
      setFuelType(indent.fuel_type);
      setAmount(indent.amount);
      setQuantity(indent.quantity);
      setStatus(indent.status || 'Pending');
      setDate(indent.date ? new Date(indent.date) : undefined);
      
      // Fetch customer name
      const fetchCustomerName = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('name')
            .eq('id', indent.customer_id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setCustomerName(data.name);
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCustomerName();
    }
  }, [open, indent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!date) {
        toast({
          title: "Error",
          description: "Please select a date",
          variant: "destructive"
        });
        return;
      }
      
      // Update the indent record
      const { error } = await supabase
        .from('indents')
        .update({
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          status: status,
          date: format(date, 'yyyy-MM-dd')
        })
        .eq('id', indent.id);
        
      if (error) throw error;
      
      // If there's a linked transaction, update it too
      if (indent.transaction) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({
            fuel_type: fuelType,
            amount: amount,
            quantity: quantity,
            date: format(date, 'yyyy-MM-dd')
          })
          .eq('id', indent.transaction.id);
          
        if (transactionError) throw transactionError;
      }
      
      toast({
        title: "Success",
        description: "Indent updated successfully"
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating indent:', error);
      toast({
        title: "Error",
        description: "Failed to update indent",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenBillDialog = () => {
    setBillDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Indent #{indent.indent_number}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="fuel-type">Fuel Type</Label>
              <Select
                value={fuelType}
                onValueChange={setFuelType}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Speed">Speed</SelectItem>
                  <SelectItem value="Power">Power</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Quantity (L)</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-[180px]"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-[180px]"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Rate per liter</Label>
              <span className="text-sm">
                INR {quantity > 0 ? (amount / quantity).toFixed(2) : '0.00'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter className="flex flex-row justify-between">
            <Button 
              variant="outline"
              onClick={handleOpenBillDialog}
              className="gap-1"
              disabled={isLoading}
            >
              <FileText className="h-4 w-4" />
              Generate Bill
            </Button>
            
            <div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bill Preview Dialog */}
      {indent.transaction && (
        <BillPreviewDialog
          open={billDialogOpen}
          onOpenChange={setBillDialogOpen}
          transaction={indent.transaction}
          indent={indent}
          vehicleNumber={indent.vehicle_number}
          customerName={customerName}
        />
      )}
    </>
  );
};
