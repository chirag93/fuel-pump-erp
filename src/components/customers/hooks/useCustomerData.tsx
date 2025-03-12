
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase, Customer, Vehicle, Indent, IndentBooklet, Transaction } from '@/integrations/supabase/client';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

export const useCustomerData = (customerId: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [indentBooklets, setIndentBooklets] = useState<IndentBooklet[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchCustomerData(customerId);
      fetchVehicles(customerId);
      fetchIndents(customerId);
      fetchIndentBooklets(customerId);
      fetchTransactions(customerId);
    }
  }, [customerId]);

  const fetchCustomerData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setCustomer(data as Customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', id);

      if (error) throw error;
      
      setVehicles(data as Vehicle[]);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchIndents = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('indents')
        .select(`*, vehicles(number)`)
        .eq('customer_id', id);

      if (error) throw error;
      
      // Process data to include vehicle number
      const processedIndents = data.map(indent => ({
        ...indent,
        vehicle_number: indent.vehicles ? indent.vehicles.number : 'Unknown',
      }));
      
      setIndents(processedIndents as unknown as Indent[]);
    } catch (error) {
      console.error('Error fetching indents:', error);
    }
  };

  const fetchIndentBooklets = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('customer_id', id);

      if (error) throw error;
      
      if (data) {
        // Transform the data to ensure status is one of the allowed types
        const typedBooklets: IndentBooklet[] = data.map(booklet => ({
          ...booklet,
          status: booklet.status as 'Active' | 'Completed' | 'Cancelled'
        }));
        setIndentBooklets(typedBooklets);
      }
    } catch (error) {
      console.error('Error fetching indent booklets:', error);
    }
  };

  const fetchTransactions = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          vehicles:vehicle_id(number)
        `)
        .eq('customer_id', id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Process data to include vehicle number
      const processedTransactions = data.map(transaction => ({
        ...transaction,
        vehicle_number: transaction.vehicles ? transaction.vehicles.number : 'Unknown',
      }));
      
      setTransactions(processedTransactions as TransactionWithDetails[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Function to update customer balance when a new transaction is added
  const updateCustomerBalance = async (transaction: Transaction) => {
    try {
      if (customer) {
        let balanceChange = 0;
        
        // If payment method is credit, add to balance
        if (transaction.payment_method === 'credit') {
          balanceChange = transaction.amount;
        } 
        // If payment method is cash or other, subtract from balance
        else if (transaction.payment_method === 'cash') {
          balanceChange = -transaction.amount;
        }
        
        // Calculate new balance
        const newBalance = (customer.balance || 0) + balanceChange;
        
        // Update customer record
        const { error } = await supabase
          .from('customers')
          .update({ balance: newBalance })
          .eq('id', customer.id);
        
        if (error) throw error;
        
        // Update local state
        setCustomer({
          ...customer,
          balance: newBalance
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating customer balance:', error);
      toast({
        title: "Error",
        description: "Failed to update customer balance",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    customer,
    vehicles,
    indents,
    indentBooklets,
    transactions,
    isLoading,
    setVehicles,
    setIndentBooklets,
    updateCustomerBalance
  };
};
