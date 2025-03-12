import { useState, useEffect } from 'react';
import { supabase, Transaction, FuelSettings, Customer, Vehicle } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TransactionForm from '@/components/fuel/TransactionForm';
import { toast } from '@/hooks/use-toast';

const RecordIndent = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fuelSettings, setFuelSettings] = useState<FuelSettings[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetchTransactions();
    fetchFuelSettings();
    fetchCustomers();
    fetchVehicles();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, customers(name), vehicles(number)`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) {
        const processedTransactions = data.map(transaction => ({
          ...transaction,
          customer_name: transaction.customers ? transaction.customers.name : null,
          vehicle_number: transaction.vehicles ? transaction.vehicles.number : null,
        }));
        setTransactions(processedTransactions as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load recent transactions",
        variant: "destructive"
      });
    }
  };

  const fetchFuelSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('*');

      if (error) throw error;
      if (data) {
        setFuelSettings(data as FuelSettings[]);
      }
    } catch (error) {
      console.error('Error fetching fuel settings:', error);
      toast({
        title: "Error",
        description: "Failed to load fuel settings",
        variant: "destructive"
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*');

      if (error) throw error;
      if (data) {
        setCustomers(data as Customer[]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');

      if (error) throw error;
      if (data) {
        setVehicles(data as Vehicle[]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive"
      });
    }
  };

  const handleTransactionSubmit = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select(`*, customers(name), vehicles(number)`);

      if (error) throw error;

      if (transaction && transaction.length > 0) {
        const newTransaction = transaction[0];
        setTransactions(prevTransactions => [newTransaction, ...prevTransactions]);
        toast({
          title: "Success",
          description: "Transaction recorded successfully!"
        });
      } else {
        toast({
          title: "Warning",
          description: "Transaction recorded, but there was an issue retrieving it.",
          variant: "warning"
        });
      }
      fetchTransactions();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Record Indent</h1>
      
      <Tabs defaultValue="fueling" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="fueling">Record Transaction</TabsTrigger>
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fueling">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Record Fuel Transaction</CardTitle>
                <CardDescription>
                  Enter details of fuel dispensed to a customer or vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionForm 
                  onSubmitTransaction={handleTransactionSubmit} 
                  isSubmitting={isSubmitting}
                  customers={customers}
                  vehicles={vehicles}
                />
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              {fuelSettings.map(setting => (
                <Card key={setting.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{setting.fuel_type}</CardTitle>
                    <CardDescription>Current price: ₹{setting.current_price}/liter</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tank capacity:</span>
                        <span>{setting.tank_capacity.toLocaleString()} liters</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current level:</span>
                        <span>{setting.current_level.toLocaleString()} liters</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Available percentage:</span>
                        <span>{Math.round((setting.current_level / setting.tank_capacity) * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="recent">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Last 20 fuel transactions recorded in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fuel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty (L)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.customer_name || 'Walk-in'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.vehicle_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.fuel_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ₹{transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                            {transaction.payment_method}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecordIndent;
