
import { supabase, Customer } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch all customers from the database
 */
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetch('/api/customers');
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
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
    const response = await fetch(`/api/customers/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data;
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
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.customer) {
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
      
      return result.customer;
    } else {
      throw new Error('Failed to create customer');
    }
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
    const response = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.customer) {
      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
      
      return result.customer;
    } else {
      throw new Error('Failed to update customer');
    }
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
    const response = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ balance: newBalance }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Error updating customer balance:', error);
    return false;
  }
};
