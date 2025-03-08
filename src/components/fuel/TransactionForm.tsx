import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FuelRate {
  fuel_type: string;
  price_per_unit: number;
}

interface TransactionFormProps {
  onSubmit: (transaction: any) => void;
  vehicleNumber?: string;
  amount?: string;
  quantity?: string;
  fuelType?: string;
  customerId?: string;
  customerName?: string;
}

const TransactionForm = ({
  onSubmit,
  vehicleNumber = '',
  amount = '',
  quantity = '',
  fuelType = 'Petrol',
  customerId = '',
  customerName = '',
}: TransactionFormProps) => {
  const [transaction, setTransaction] = useState({
    vehicleNumber,
    amount,
    quantity,
    fuelType,
    customerId,
    customerName,
    paymentMethod: 'cash',
    meterReading: '',
    notes: ''
  });
  
  const [fuelRates, setFuelRates] = useState<Record<string, number>>({
    'Petrol': 100,
    'Diesel': 90,
    'Premium Petrol': 110
  });
  
  const [fuelTypes, setFuelTypes] = useState<string[]>(['Petrol', 'Diesel', 'Premium Petrol']);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Fetch fuel rates from inventory
  useEffect(() => {
    const fetchFuelRates = async () => {
      setIsLoadingRates(true);
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('fuel_type, price_per_unit')
          .order('fuel_type');
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const rates: Record<string, number> = {};
          const types: string[] = [];
          
          data.forEach((item: FuelRate) => {
            rates[item.fuel_type] = item.price_per_unit;
            types.push(item.fuel_type);
          });
          
          setFuelRates(rates);
          setFuelTypes(types);
        }
      } catch (error) {
        console.error('Error fetching fuel rates:', error);
        // Keep default rates if fetch fails
      } finally {
        setIsLoadingRates(false);
      }
    };
    
    fetchFuelRates();
  }, []);

  // Update form when props change
  useEffect(() => {
    setTransaction(prev => ({
      ...prev,
      vehicleNumber,
      amount,
      quantity,
      fuelType,
      customerId,
      customerName
    }));
  }, [vehicleNumber, amount, quantity, fuelType, customerId, customerName]);

  const handleChange = (field: string, value: string) => {
    setTransaction({ ...transaction, [field]: value });

    // Auto-calculate quantity if amount changes
    if (field === 'amount' && value) {
      const rate = fuelRates[transaction.fuelType] || 100;
      const calculatedQuantity = (parseFloat(value) / rate).toFixed(2);
      setTransaction(prev => ({ ...prev, quantity: calculatedQuantity }));
    }

    // Auto-calculate amount if quantity changes
    if (field === 'quantity' && value) {
      const rate = fuelRates[transaction.fuelType] || 100;
      const calculatedAmount = (parseFloat(value) * rate).toFixed(2);
      setTransaction(prev => ({ ...prev, amount: calculatedAmount }));
    }

    // Auto-update rate if fuel type changes
    if (field === 'fuelType' && transaction.quantity) {
      const rate = fuelRates[value] || 100;
      const calculatedAmount = (parseFloat(transaction.quantity) * rate).toFixed(2);
      setTransaction(prev => ({ ...prev, amount: calculatedAmount }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting transaction:", transaction);

    // Validation
    if (!transaction.vehicleNumber || !transaction.amount || !transaction.quantity || !transaction.meterReading) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Submit the transaction with parsed numeric values
    onSubmit({
      ...transaction,
      amount: parseFloat(transaction.amount),
      quantity: parseFloat(transaction.quantity),
      timestamp: new Date().toISOString()
    });

    // Reset form (optional)
    setTransaction({
      vehicleNumber: '',
      amount: '',
      quantity: '',
      fuelType: 'Petrol',
      customerId: '',
      customerName: '',
      paymentMethod: 'cash',
      meterReading: '',
      notes: ''
    });
  };

  const handleTakePicture = () => {
    toast({
      title: "Camera access",
      description: "Would open camera to capture meter reading",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vehicleNumber">Vehicle Number</Label>
        <Input
          id="vehicleNumber"
          value={transaction.vehicleNumber}
          onChange={(e) => handleChange('vehicleNumber', e.target.value)}
          placeholder="Enter vehicle number"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fuelType">Fuel Type</Label>
          <Select
            value={transaction.fuelType}
            onValueChange={(value) => handleChange('fuelType', value)}
            disabled={isLoadingRates}
          >
            <SelectTrigger id="fuelType">
              <SelectValue placeholder={isLoadingRates ? "Loading fuel types..." : "Select fuel type"} />
            </SelectTrigger>
            <SelectContent>
              {fuelTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type} (₹{fuelRates[type]}/L)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            value={transaction.paymentMethod}
            onValueChange={(value) => handleChange('paymentMethod', value)}
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">
                <div className="flex items-center">
                  <Banknote className="mr-2 h-4 w-4" />
                  <span>Cash</span>
                </div>
              </SelectItem>
              <SelectItem value="card">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Card</span>
                </div>
              </SelectItem>
              <SelectItem value="upi">
                <div className="flex items-center">
                  <Smartphone className="mr-2 h-4 w-4" />
                  <span>UPI</span>
                </div>
              </SelectItem>
              <SelectItem value="credit">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Credit (Customer Account)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            value={transaction.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (L)</Label>
          <Input
            id="quantity"
            type="number"
            value={transaction.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="Enter quantity"
            required
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meterReading">Meter Reading</Label>
        <div className="flex gap-2">
          <Input
            id="meterReading"
            value={transaction.meterReading}
            onChange={(e) => handleChange('meterReading', e.target.value)}
            placeholder="Enter meter reading"
            className="flex-1"
            required
          />
          <Button type="button" variant="outline" onClick={handleTakePicture}>
            <Camera className="h-4 w-4 mr-2" />
            Capture
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={transaction.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Any additional notes"
        />
      </div>

      <Button type="submit" className="w-full">Record Transaction</Button>
    </form>
  );
};

export default TransactionForm;
