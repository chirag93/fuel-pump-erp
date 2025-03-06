
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

    // Auto-calculate quantity if amount changes (assuming fixed rate)
    if (field === 'amount' && value) {
      const fuelRates = {
        'Petrol': 100, // ₹100 per liter
        'Diesel': 90,  // ₹90 per liter
        'Premium Petrol': 110 // ₹110 per liter
      };
      const rate = fuelRates[transaction.fuelType as keyof typeof fuelRates] || 100;
      const calculatedQuantity = (parseFloat(value) / rate).toFixed(2);
      setTransaction(prev => ({ ...prev, quantity: calculatedQuantity }));
    }

    // Auto-calculate amount if quantity changes
    if (field === 'quantity' && value) {
      const fuelRates = {
        'Petrol': 100,
        'Diesel': 90,
        'Premium Petrol': 110
      };
      const rate = fuelRates[transaction.fuelType as keyof typeof fuelRates] || 100;
      const calculatedAmount = (parseFloat(value) * rate).toFixed(2);
      setTransaction(prev => ({ ...prev, amount: calculatedAmount }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!transaction.vehicleNumber || !transaction.amount || !transaction.quantity || !transaction.meterReading) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Submit the transaction
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
          >
            <SelectTrigger id="fuelType">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Premium Petrol">Premium Petrol</SelectItem>
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
