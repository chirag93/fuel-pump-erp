import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const MobileRecordIndent = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [vehicles, setVehicles] = useState<{id: string, name: string}[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [amount, setAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [staff, setStaff] = useState<{id: string, name: string}[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [fuelPrices, setFuelPrices] = useState<{[key: string]: number}>({
    Petrol: 0,
    Diesel: 0
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          setCustomers(data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error loading customers",
          description: "Could not load customers list",
          variant: "destructive"
        });
      }
    };
    
    fetchCustomers();
  }, []);

  // Fetch vehicles when customer is selected - fixed to work with the actual column names in the vehicles table
  useEffect(() => {
    if (!selectedCustomer) {
      setVehicles([]);
      setSelectedVehicle('');
      return;
    }
    
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, number') // Using 'number' which is the actual column name in the DB
          .eq('customer_id', selectedCustomer)
          .order('number', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          setVehicles(data.map(v => ({ id: v.id, name: v.number }))); // Map to our expected format
          if (data.length > 0) {
            setSelectedVehicle(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        toast({
          title: "Error loading vehicles",
          description: "Could not load vehicles for selected customer",
          variant: "destructive"
        });
      }
    };
    
    fetchVehicles();
  }, [selectedCustomer]);

  // Fetch staff
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setStaff(data);
          setSelectedStaff(data[0].id);
        } else {
          toast({
            title: "No staff members found",
            description: "Please add at least one staff member",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error loading staff",
          description: "Could not load staff list",
          variant: "destructive"
        });
      }
    };
    
    fetchStaff();
  }, []);

  // Fetch fuel prices
  useEffect(() => {
    const fetchFuelPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('fuel_type, current_price');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const priceMap: {[key: string]: number} = {};
          data.forEach(item => {
            priceMap[item.fuel_type] = item.current_price;
          });
          setFuelPrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching fuel prices:', error);
      }
    };
    
    fetchFuelPrices();
  }, []);

  // Auto-calculate amount when quantity changes
  useEffect(() => {
    if (quantity > 0 && fuelPrices[fuelType]) {
      const calculatedAmount = quantity * fuelPrices[fuelType];
      setAmount(calculatedAmount);
    }
  }, [quantity, fuelType, fuelPrices]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value) || 0;
    setQuantity(newQuantity);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(e.target.value) || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedCustomer || !selectedVehicle || !fuelType || !amount || !quantity || !selectedStaff) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Generate a UUID for the transaction
      const transactionId = crypto.randomUUID();

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          staff_id: selectedStaff,
          date: new Date().toISOString(),
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          discount_amount: 0,
          payment_method: 'Cash', // Default payment method
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        throw transactionError;
      }

      toast({
        title: "Success",
        description: "Transaction recorded successfully"
      });
      
      // Reset form
      setSelectedVehicle('');
      setFuelType('Petrol');
      setAmount(0);
      setQuantity(0);
      
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Record Transaction</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer & Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger id="customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedCustomer && (
            <div>
              <Label htmlFor="vehicle">Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-vehicles" disabled>No vehicles found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedCustomer && selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fuel Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol {fuelPrices.Petrol > 0 ? `(₹${fuelPrices.Petrol}/L)` : ''}</SelectItem>
                    <SelectItem value="Diesel">Diesel {fuelPrices.Diesel > 0 ? `(₹${fuelPrices.Diesel}/L)` : ''}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="staffMember">Staff Member</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger id="staffMember">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.length === 0 ? (
                      <SelectItem value="no-staff" disabled>No staff members found</SelectItem>
                    ) : (
                      staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity (L)</Label>
                <Input
                  type="number"
                  id="quantity"
                  value={quantity === 0 ? '' : quantity}
                  onChange={handleQuantityChange}
                  placeholder="Enter quantity"
                />
                {fuelPrices[fuelType] > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Current price: ₹{fuelPrices[fuelType]}/L</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  type="number"
                  id="amount"
                  value={amount === 0 ? '' : amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                />
              </div>
              
              <Button disabled={isSubmitting} type="submit" className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Transaction'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileRecordIndent;
