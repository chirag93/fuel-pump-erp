
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase, Indent, Transaction } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

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

const indentFormSchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  status: z.string(),
  fuel_type: z.string(),
});

type IndentFormValues = z.infer<typeof indentFormSchema>;

export function IndentEditDialog({ open, onOpenChange, indent, onUpdate }: IndentEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IndentFormValues>({
    resolver: zodResolver(indentFormSchema),
    defaultValues: {
      quantity: indent.quantity,
      amount: indent.amount,
      status: indent.status || 'Pending',
      fuel_type: indent.fuel_type,
    }
  });

  const onSubmit = async (values: IndentFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('indents')
        .update({
          quantity: values.quantity,
          amount: values.amount,
          status: values.status,
          fuel_type: values.fuel_type,
        })
        .eq('id', indent.id);

      if (error) throw error;
      
      onUpdate();
    } catch (error) {
      console.error('Error updating indent:', error);
      toast({
        title: "Error",
        description: "Failed to update indent",
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
          <DialogTitle>Edit Indent #{indent.indent_number}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fuel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (Litres)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
