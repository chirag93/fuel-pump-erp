
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
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RecordPaymentDialogProps {
  customerId: string;
  customerName?: string;
  currentBalance?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentRecorded: () => void;
}

export default function RecordPaymentDialog({
  customerId,
  customerName,
  currentBalance,
  open,
  onOpenChange,
  onPaymentRecorded
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount greater than zero",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a new payment record
      const { error: paymentError } = await supabase
        .from('customer_payments')
        .insert({
          customer_id: customerId,
          amount: amount,
          payment_method: paymentMethod,
          notes: notes,
          date: new Date().toISOString()
        });

      if (paymentError) throw paymentError;

      // Record a transaction with type PAYMENT
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: crypto.randomUUID(),
          customer_id: customerId,
          date: new Date().toISOString().split('T')[0],
          fuel_type: 'PAYMENT',
          amount: amount,
          quantity: 0,
          payment_method: paymentMethod,
          staff_id: '00000000-0000-0000-0000-000000000000' // Placeholder staff ID
        });

      if (transactionError) throw transactionError;

      // Update the customer balance
      const newBalance = ((currentBalance || 0) - amount);
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast({
        title: "Payment recorded",
        description: `Successfully recorded payment of ₹${amount} for ${customerName || 'customer'}`
      });

      // Reset form and close dialog
      setAmount(0);
      setPaymentMethod('Cash');
      setNotes('');
      onOpenChange(false);
      onPaymentRecorded();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
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
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a new payment for {customerName || 'customer'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter payment amount"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
