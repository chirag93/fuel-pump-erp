
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Customer, Vehicle, Indent, IndentBooklet, Transaction } from '@/integrations/supabase/client';
import { getCustomerById, updateCustomerBalance } from '@/integrations/customers';
import { supabase } from '@/integrations/supabase/client';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (customerId) {
      fetchCustomerData(customerId);
      fetchVehicles(customerId);
      fetchIndents(customerId);
      fetchIndentBooklets(customerId);
      fetchTransactions(customerId);
    }
  }, [customerId, refreshTrigger]);

  const fetchCustomerData = async (id: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching customer data for ID:', id);
      
      const data = await getCustomerById(id);
      
      if (data) {
        console.log('Customer data found:', data);
        setCustomer(data as Customer);
      } else {
        console.error('No customer found with ID:', id);
        toast({
          title: "Customer not found",
          description: "Could not find customer with the provided ID",
          variant: "destructive"
        });
      }
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

  // For these methods, we'll continue using Supabase directly until we create dedicated API methods
  const fetchVehicles = async (id: string) => {
    try {
      console.log('Fetching vehicles for customer ID:', id);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', id);
        
      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Found ${data.length} vehicles`);
        setVehicles(data as Vehicle[]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchIndents = async (id: string) => {
    try {
      console.log('Fetching indents for customer ID:', id);
      const { data, error } = await supabase
        .from('indents')
        .select(`
          *,
          vehicles:vehicle_id (number)
        `)
        .eq('customer_id', id);
        
      if (error) {
        console.error('Error fetching indents:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Found ${data.length} indents`);
        
        // Process data to include vehicle number if needed
        const processedIndents = data.map((indent: any) => ({
          ...indent,
          vehicle_number: indent.vehicles?.number || 'Unknown',
        }));
        
        setIndents(processedIndents as unknown as Indent[]);
      }
    } catch (error) {
      console.error('Error fetching indents:', error);
    }
  };

  const fetchIndentBooklets = async (id: string) => {
    try {
      console.log('Fetching indent booklets for customer ID:', id);
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('customer_id', id);
        
      if (error) {
        console.error('Error fetching indent booklets:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Found ${data.length} indent booklets`);
        // Transform the data to ensure status is one of the allowed types
        const typedBooklets: IndentBooklet[] = data.map((booklet: any) => ({
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
      console.log('Fetching transactions for customer ID:', id);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          vehicles:vehicle_id (number)
        `)
        .eq('customer_id', id);
        
      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Found ${data.length} transactions`);
        
        // Process data to include vehicle number
        const processedTransactions = data.map((transaction: any) => ({
          ...transaction,
          vehicle_number: transaction.vehicles?.number || 'Unknown',
        }));
        
        setTransactions(processedTransactions as TransactionWithDetails[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (!customer || !customer.id) return false;
    
    const success = await updateCustomerBalance(customer.id, newBalance);
    if (success) {
      // Trigger a refresh to load the updated data
      refreshData();
    }
    return success;
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
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
    updateBalance,
    refreshData
  };
};
