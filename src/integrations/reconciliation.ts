
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from './utils';

export interface ReconciliationTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'reconciled' | 'unreconciled';
}

export interface ReconciliationSummary {
  systemBalance: number;
  bankBalance: number;
  difference: number;
}

export interface ReconciliationProgress {
  bankReconciliation: number;
  cashReconciliation: number;
  inventoryReconciliation: number;
}

// Fetch transactions for reconciliation
export const getReconciliationTransactions = async (
  startDate?: string,
  endDate?: string,
  searchTerm?: string
): Promise<ReconciliationTransaction[]> => {
  try {
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view reconciliation data",
        variant: "destructive"
      });
      return [];
    }

    // Build query to fetch transactions from database
    let query = supabase
      .from('transactions')
      .select(`
        id,
        date,
        fuel_type,
        amount,
        payment_method,
        customers (name)
      `)
      .eq('fuel_pump_id', fuelPumpId);
    
    // Add date filtering
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    // Execute query
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching reconciliation transactions:', error);
      throw error;
    }
    
    if (!data) return [];
    
    // Transform data into ReconciliationTransaction format
    const transactions = data.map(item => {
      const description = `${item.fuel_type} - ${item.customers?.name || 'Unknown'} (${item.payment_method})`;
      
      // Randomly assign reconciliation status for demo - in a real app this would be a separate field in the database
      const status = Math.random() > 0.3 ? 'reconciled' : 'unreconciled';
      
      return {
        id: item.id,
        date: item.date,
        description,
        amount: item.amount,
        status
      };
    });
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return transactions.filter(transaction => 
        transaction.id.toLowerCase().includes(term) || 
        transaction.description.toLowerCase().includes(term)
      );
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching reconciliation transactions:', error);
    toast({
      title: "Error",
      description: "Failed to load reconciliation data",
      variant: "destructive"
    });
    return [];
  }
};

// Get reconciliation summary data
export const getReconciliationSummary = async (): Promise<ReconciliationSummary> => {
  try {
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      return { systemBalance: 0, bankBalance: 0, difference: 0 };
    }

    // In a real app, this would fetch actual balances from database
    // For demonstration, we'll calculate based on transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('fuel_pump_id', fuelPumpId);
    
    if (error) {
      console.error('Error fetching reconciliation summary:', error);
      throw error;
    }
    
    // Calculate system balance based on transactions
    const systemBalance = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    
    // In a real app, bank balance would come from bank statement import
    // Here we'll simulate a small difference
    const bankBalance = systemBalance - (Math.random() * 1000 + 500);
    
    return {
      systemBalance,
      bankBalance,
      difference: systemBalance - bankBalance
    };
  } catch (error) {
    console.error('Error fetching reconciliation summary:', error);
    return {
      systemBalance: 0,
      bankBalance: 0,
      difference: 0
    };
  }
};

// Get reconciliation progress data
export const getReconciliationProgress = async (): Promise<ReconciliationProgress> => {
  try {
    // In a real app, this would be calculated based on reconciled vs unreconciled transactions
    // For demonstration, we'll generate semi-random values
    
    // Calculate progress percentages (realistic but random)
    const bankReconciliation = Math.floor(Math.random() * 30) + 60; // 60-90%
    const cashReconciliation = Math.floor(Math.random() * 20) + 75; // 75-95%
    const inventoryReconciliation = Math.floor(Math.random() * 50) + 30; // 30-80%
    
    return {
      bankReconciliation,
      cashReconciliation,
      inventoryReconciliation
    };
  } catch (error) {
    console.error('Error fetching reconciliation progress:', error);
    return {
      bankReconciliation: 0,
      cashReconciliation: 0,
      inventoryReconciliation: 0
    };
  }
};

// Update transaction reconciliation status
export const updateReconciliationStatus = async (
  transactionIds: string[], 
  status: 'reconciled' | 'unreconciled'
): Promise<boolean> => {
  try {
    if (!transactionIds.length) return false;
    
    // In a real app, this would update a reconciliation_status field in the database
    // For demonstration, we'll just log the action
    console.log(`Marking transactions as ${status}:`, transactionIds);
    
    // Simulate success with a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error(`Error updating reconciliation status:`, error);
    toast({
      title: "Error",
      description: `Failed to update reconciliation status`,
      variant: "destructive"
    });
    return false;
  }
};
