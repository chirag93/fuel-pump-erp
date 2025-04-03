
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer, Vehicle, Indent, IndentBooklet, Transaction } from '@/integrations/supabase/client';
import { getCustomerById, updateCustomerBalance } from '@/integrations/customers';
import { getVehiclesByCustomerId } from '@/integrations/vehicles';
import { getIndentsByCustomerId } from '@/integrations/indents';
import { getIndentBookletsByCustomerId } from '@/integrations/indentBooklets';
import { getTransactionsByCustomerId, TransactionWithDetails } from '@/integrations/transactions';

// Define query keys for better cache management
const QUERY_KEYS = {
  customer: (id: string) => ['customer', id],
  vehicles: (id: string) => ['vehicles', id],
  indents: (id: string) => ['indents', id],
  indentBooklets: (id: string) => ['indentBooklets', id],
  transactions: (id: string) => ['transactions', id],
};

export const useCustomerData = (customerId: string) => {
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Customer data query
  const { 
    data: customer, 
    isLoading: isLoadingCustomer 
  } = useQuery({
    queryKey: QUERY_KEYS.customer(customerId),
    queryFn: () => getCustomerById(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    meta: {
      onSuccess: (data: Customer) => {
        console.log('Customer data fetched successfully:', data);
      },
      onError: (error: Error) => {
        console.error('Error fetching customer:', error);
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive"
        });
      }
    }
  });

  // Vehicles query
  const { 
    data: vehicles = [], 
    isLoading: isLoadingVehicles,
  } = useQuery({
    queryKey: QUERY_KEYS.vehicles(customerId),
    queryFn: () => getVehiclesByCustomerId(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching vehicles:', error);
      }
    }
  });

  // Indents query
  const { 
    data: indents = [], 
    isLoading: isLoadingIndents 
  } = useQuery({
    queryKey: QUERY_KEYS.indents(customerId),
    queryFn: () => getIndentsByCustomerId(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching indents:', error);
      }
    }
  });

  // Indent booklets query
  const { 
    data: indentBooklets = [], 
    isLoading: isLoadingBooklets 
  } = useQuery({
    queryKey: QUERY_KEYS.indentBooklets(customerId),
    queryFn: () => getIndentBookletsByCustomerId(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching indent booklets:', error);
        toast({
          title: "Error",
          description: "Failed to load indent booklets",
          variant: "destructive"
        });
      }
    }
  });

  // Transactions query
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useQuery({
    queryKey: QUERY_KEYS.transactions(customerId),
    queryFn: () => getTransactionsByCustomerId(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching transactions:', error);
      }
    }
  });

  // Update balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: (newBalance: number) => updateCustomerBalance(customerId, newBalance),
    onSuccess: () => {
      // Invalidate customer data cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customer(customerId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(customerId) });
      
      toast({
        title: "Success",
        description: "Customer balance updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update customer balance",
        variant: "destructive"
      });
    }
  });

  const updateBalance = async (newBalance: number) => {
    if (!customer || !customer.id) return false;
    return updateBalanceMutation.mutate(newBalance);
  };

  const refreshData = useCallback(() => {
    console.log('Refreshing customer data');
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customer(customerId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles(customerId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.indents(customerId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.indentBooklets(customerId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(customerId) });
    setRefreshTrigger(prev => prev + 1);
  }, [customerId, queryClient]);

  // Helper to update vehicles
  const setVehicles = useCallback((newVehicles: Vehicle[]) => {
    queryClient.setQueryData(QUERY_KEYS.vehicles(customerId), newVehicles);
  }, [customerId, queryClient]);

  // Helper to update booklets
  const setIndentBooklets = useCallback((newBooklets: IndentBooklet[]) => {
    queryClient.setQueryData(QUERY_KEYS.indentBooklets(customerId), newBooklets);
  }, [customerId, queryClient]);

  return {
    customer,
    vehicles,
    indents,
    indentBooklets,
    transactions,
    isLoading: isLoadingCustomer || isLoadingVehicles || isLoadingIndents,
    isLoadingBooklets,
    setVehicles,
    setIndentBooklets,
    updateBalance,
    refreshData
  };
};
