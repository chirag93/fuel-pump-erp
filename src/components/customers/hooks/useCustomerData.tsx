
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Customer, Vehicle, Indent, IndentBooklet, Transaction } from '@/integrations/supabase/client';
import { getCustomerById, updateCustomerBalance } from '@/integrations/customers';
import { getVehiclesByCustomerId } from '@/integrations/vehicles';
import { getIndentsByCustomerId } from '@/integrations/indents';
import { getIndentBookletsByCustomerId } from '@/integrations/indentBooklets';
import { getTransactionsByCustomerId, TransactionWithDetails } from '@/integrations/transactions';

export const useCustomerData = (customerId: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [indentBooklets, setIndentBooklets] = useState<IndentBooklet[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBooklets, setIsLoadingBooklets] = useState(true);
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

  const fetchVehicles = async (id: string) => {
    try {
      console.log('Fetching vehicles for customer ID:', id);
      const data = await getVehiclesByCustomerId(id);
      console.log(`Found ${data.length} vehicles`);
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchIndents = async (id: string) => {
    try {
      console.log('Fetching indents for customer ID:', id);
      const data = await getIndentsByCustomerId(id);
      console.log(`Found ${data.length} indents`);
      setIndents(data);
    } catch (error) {
      console.error('Error fetching indents:', error);
    }
  };

  const fetchIndentBooklets = async (id: string) => {
    try {
      setIsLoadingBooklets(true);
      console.log('Fetching indent booklets for customer ID:', id);
      const data = await getIndentBookletsByCustomerId(id);
      console.log(`Found ${data.length} indent booklets:`, data);
      setIndentBooklets(data);
    } catch (error) {
      console.error('Error fetching indent booklets:', error);
      toast({
        title: "Error",
        description: "Failed to load indent booklets",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBooklets(false);
    }
  };

  const fetchTransactions = async (id: string) => {
    try {
      console.log('Fetching transactions for customer ID:', id);
      const data = await getTransactionsByCustomerId(id);
      console.log(`Found ${data.length} transactions`);
      setTransactions(data);
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
    isLoadingBooklets,
    setVehicles,
    setIndentBooklets,
    updateBalance,
    refreshData
  };
};
