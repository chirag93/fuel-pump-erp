
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';

interface AmountQuantityInputsProps {
  amount: number | string;
  setAmount: (value: number | '') => void;
  quantity: number | string;
  setQuantity: (value: number | '') => void;
  fuelType: string;
  currentFuelPrice?: number;
}

export const AmountQuantityInputs = ({
  amount,
  setAmount,
  quantity,
  setQuantity,
  fuelType,
  currentFuelPrice
}: AmountQuantityInputsProps) => {
  const [fuelPrice, setFuelPrice] = useState<number>(currentFuelPrice || 0);
  const [priceIsLoading, setPriceIsLoading] = useState(false);
  const [amountInputFocused, setAmountInputFocused] = useState(false);
  const [quantityInputFocused, setQuantityInputFocused] = useState(false);

  // Fetch current fuel price whenever fuel type changes or currentFuelPrice is provided
  useEffect(() => {
    if (currentFuelPrice) {
      setFuelPrice(currentFuelPrice);
      return;
    }
    
    const fetchFuelPrice = async () => {
      if (!fuelType) return;
      
      try {
        setPriceIsLoading(true);
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available');
          setPriceIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('current_price')
          .eq('fuel_pump_id', fuelPumpId)
          .eq('fuel_type', fuelType)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching fuel price:', error);
          setPriceIsLoading(false);
          return;
        }
        
        if (data) {
          setFuelPrice(data.current_price);
        } else {
          console.log('No price data found for fuel type:', fuelType);
          setFuelPrice(0);
        }
      } catch (error) {
        console.error('Error in fetchFuelPrice:', error);
        setFuelPrice(0);
      } finally {
        setPriceIsLoading(false);
      }
    };
    
    fetchFuelPrice();
  }, [fuelType, currentFuelPrice]);

  // Update fuel price when currentFuelPrice changes
  useEffect(() => {
    if (currentFuelPrice) {
      setFuelPrice(currentFuelPrice);
    }
  }, [currentFuelPrice]);

  // Calculate quantity based on amount (when amount changes and quantity is not being edited)
  useEffect(() => {
    if (amountInputFocused && !quantityInputFocused && amount !== '' && fuelPrice > 0) {
      const calculatedQuantity = Number(amount) / fuelPrice;
      // Use toFixed(2) to limit to 2 decimal places and avoid floating point precision issues
      setQuantity(parseFloat(calculatedQuantity.toFixed(2)));
    }
  }, [amount, fuelPrice, amountInputFocused, quantityInputFocused, setQuantity]);

  // Calculate amount based on quantity (when quantity changes and amount is not being edited)
  useEffect(() => {
    if (quantityInputFocused && !amountInputFocused && quantity !== '' && fuelPrice > 0) {
      const calculatedAmount = Number(quantity) * fuelPrice;
      // Use toFixed(2) to limit to 2 decimal places and avoid floating point precision issues
      setAmount(parseFloat(calculatedAmount.toFixed(2)));
    }
  }, [quantity, fuelPrice, quantityInputFocused, amountInputFocused, setAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setAmount('');
    } else {
      // Ensure we're working with a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setAmount(numValue);
      }
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity('');
    } else {
      // Ensure we're working with a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setQuantity(numValue);
      }
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="amount" className="text-sm font-medium mb-1 block">
          Amount (₹)
        </Label>
        <Input
          id="amount"
          type="number"
          value={amount.toString()}
          onChange={handleAmountChange}
          onFocus={() => setAmountInputFocused(true)}
          onBlur={() => setAmountInputFocused(false)}
          placeholder="Enter amount"
          step="0.01"
        />
        {fuelPrice > 0 && (
          <p className="text-xs text-muted-foreground mt-1">Current price: ₹{fuelPrice}/L</p>
        )}
      </div>
      <div>
        <Label htmlFor="quantity" className="text-sm font-medium mb-1 block">
          Quantity (L)
        </Label>
        <Input
          id="quantity"
          type="number"
          value={quantity.toString()}
          onChange={handleQuantityChange}
          onFocus={() => setQuantityInputFocused(true)}
          onBlur={() => setQuantityInputFocused(false)}
          placeholder="Enter quantity"
          step="0.01"
        />
      </div>
    </div>
  );
};
