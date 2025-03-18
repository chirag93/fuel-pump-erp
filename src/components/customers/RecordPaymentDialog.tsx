
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Customer } from '@/integrations/supabase/client';

const formSchema = z.object({
  amount: z.string()
    .min(1, { message: 'Amount is required' })
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    })
    .transform(val => parseFloat(val)), // Convert string to number
  paymentMethod: z.enum(['Cash', 'Card', 'UPI', 'Bank Transfer']),
  notes: z.string().optional(),
  date: z.string().min(1, { message: 'Date is required' }),
});

type FormValues = z.infer<typeof formSchema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onPaymentRecorded?: () => void;
}

export function RecordPaymentDialog({ open, onOpenChange, customerId, onPaymentRecorded }: RecordPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      paymentMethod: 'Cash',
      notes: '',
      date: today,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      // Create a transaction record
      const transactionData = {
        id: crypto.randomUUID(),
        customer_id: customerId,
        date: values.date, // Use date from form
        amount: values.amount, // This is now a number due to the transform
        quantity: 0, // There's no fuel in this transaction, it's just a payment
        payment_method: values.paymentMethod,
        fuel_type: 'PAYMENT', // Mark it as a payment
        staff_id: crypto.randomUUID(), // Generate a valid UUID instead of using "system"
      };
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData);
      
      if (transactionError) throw transactionError;
      
      // Call the RPC function properly and handle the returned data
      const { data: updatedBalance, error: customerError } = await supabase
        .rpc('decrement_balance', { 
          customer_id: customerId, 
          amount_value: values.amount 
        });
      
      if (customerError) throw customerError;
      
      // Update the customer balance with the returned value
      const { error: updateError } = await supabase
        .from('customers')
        .update({ balance: updatedBalance })
        .eq('id', customerId);
        
      if (updateError) throw updateError;
      
      toast({
        title: 'Payment recorded',
        description: `₹${values.amount} has been recorded for the customer.`,
      });
      
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while recording the payment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment received from the customer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about the payment"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Record Payment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
