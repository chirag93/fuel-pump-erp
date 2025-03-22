import { supabase, Customer } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch all customers from the database
 */
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    toast({
      title: "Error",
      description: "Failed to load customers",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Fetch a single customer by ID
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    console.log('API getCustomerById called for ID:', id);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    toast({
      title: "Error",
      description: "Failed to load customer data",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Create a new customer
 */
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at'>): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Success",
      description: "Customer created successfully"
    });
    
    return data as Customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    toast({
      title: "Error",
      description: "Failed to create customer",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Update an existing customer
 */
export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Success",
      description: "Customer updated successfully"
    });
    
    return data as Customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    toast({
      title: "Error",
      description: "Failed to update customer",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Update customer balance
 */
export const updateCustomerBalance = async (id: string, newBalance: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', id);
      
    if (error) throw error;
    return true;
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
