
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Customer, Vehicle, Indent, IndentBooklet, Transaction } from '@/integrations/supabase/client';
import { getCustomerById } from '@/integrations/customers';

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
      const data = await getCustomerById(id);
      if (data) {
        setCustomer(data);
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
      const response = await fetch(`/api/vehicles?customer_id=${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setVehicles(data as Vehicle[]);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchIndents = async (id: string) => {
    try {
      const response = await fetch(`/api/indents?customer_id=${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process data to include vehicle number if needed
      const processedIndents = data.map((indent: any) => ({
        ...indent,
        vehicle_number: indent.vehicle_number || 'Unknown',
      }));
      
      setIndents(processedIndents as unknown as Indent[]);
    } catch (error) {
      console.error('Error fetching indents:', error);
    }
  };

  const fetchIndentBooklets = async (id: string) => {
    try {
      // If there's an API endpoint for indent booklets, uncomment and use this:
      // const response = await fetch(`/api/indent-booklets?customer_id=${id}`);
      // const data = await response.json();
      
      // For now, use Supabase directly if the API endpoint doesn't exist
      const { data, error } = await fetch(`/api/indent-booklets?customer_id=${id}`)
        .then(res => res.json())
        .catch(() => ({ data: null, error: new Error('Failed to fetch indent booklets') }));

      if (error) throw error;
      
      if (data) {
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
      const response = await fetch(`/api/transactions?customer_id=${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process data to include vehicle number
      const processedTransactions = data.map((transaction: any) => ({
        ...transaction,
        vehicle_number: transaction.vehicle_number || 'Unknown',
      }));
      
      setTransactions(processedTransactions as TransactionWithDetails[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
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
    refreshData
  };
};
