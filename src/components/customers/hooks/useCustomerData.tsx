
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
        .select(`*, vehicles(number)`)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

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

  return {
    customer,
    vehicles,
    indents,
    indentBooklets,
    transactions,
    isLoading,
    setVehicles,
    setIndentBooklets
  };
};
