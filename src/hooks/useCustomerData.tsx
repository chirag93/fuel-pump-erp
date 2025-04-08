
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  contact: string;
  email: string;
  balance: number;
}

export interface Vehicle {
  id: string;
  number: string;
  type: string;
  capacity: string;
  customer_id: string;
}

export interface Transaction {
  id: string;
  date: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  payment_method: string;
  vehicle_number?: string;
}

export const useCustomerData = (customerId: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.error('No fuel pump ID available');
          setError('Authentication failed. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        console.log(`Fetching data for customer ID: ${customerId} from fuel pump: ${fuelPumpId}`);
        
        // Fetch customer details
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .eq('fuel_pump_id', fuelPumpId)
          .single();
          
        if (customerError) {
          console.error('Error fetching customer:', customerError);
          throw new Error('Failed to fetch customer details');
        }
        
        if (!customerData) {
          setError('Customer not found');
          setIsLoading(false);
          return;
        }
        
        setCustomer(customerData);
        
        // Fetch vehicles
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('customer_id', customerId)
          .eq('fuel_pump_id', fuelPumpId);
          
        if (vehicleError) {
          console.error('Error fetching vehicles:', vehicleError);
          throw new Error('Failed to fetch customer vehicles');
        }
        
        setVehicles(vehicleData || []);
        
        // Fetch transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('id, date, fuel_type, quantity, amount, payment_method, vehicle_id')
          .eq('customer_id', customerId)
          .eq('fuel_pump_id', fuelPumpId)
          .order('date', { ascending: false });
          
        if (transactionError) {
          console.error('Error fetching transactions:', transactionError);
          throw new Error('Failed to fetch customer transactions');
        }
        
        // Get vehicle numbers for transactions
        const enhancedTransactions = await Promise.all((transactionData || []).map(async (transaction) => {
          if (transaction.vehicle_id) {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('number')
              .eq('id', transaction.vehicle_id)
              .maybeSingle();
              
            return {
              ...transaction,
              vehicle_number: vehicleData?.number || 'Unknown'
            };
          }
          return transaction;
        }));
        
        setTransactions(enhancedTransactions);
      } catch (error) {
        console.error('Error in fetchCustomerData:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        toast({
          title: "Error",
          description: "Failed to load customer data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [customerId]);
  
  return { customer, vehicles, transactions, isLoading, error };
};
