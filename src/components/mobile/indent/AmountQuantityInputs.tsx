
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
}

export const AmountQuantityInputs = ({
  amount,
  setAmount,
  quantity,
  setQuantity,
  fuelType
}: AmountQuantityInputsProps) => {
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  const [priceIsLoading, setPriceIsLoading] = useState(false);
  const [amountInputFocused, setAmountInputFocused] = useState(false);
  const [quantityInputFocused, setQuantityInputFocused] = useState(false);

  // Fetch current fuel price whenever fuel type changes
  useEffect(() => {
    const fetchFuelPrice = async () => {
      if (!fuelType) return;
      
      try {
        setPriceIsLoading(true);
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available');
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
          return;
        }
        
        if (data) {
          setFuelPrice(data.current_price);
        }
      } catch (error) {
        console.error('Error in fetchFuelPrice:', error);
      } finally {
        setPriceIsLoading(false);
      }
    };
    
    fetchFuelPrice();
  }, [fuelType]);

  // Calculate quantity based on amount (when amount changes and quantity is not being edited)
  useEffect(() => {
    if (amountInputFocused && !quantityInputFocused && amount !== '' && fuelPrice > 0) {
      const calculatedQuantity = Number(amount) / fuelPrice;
      setQuantity(parseFloat(calculatedQuantity.toFixed(2)));
    }
  }, [amount, fuelPrice, amountInputFocused, quantityInputFocused, setQuantity]);

  // Calculate amount based on quantity (when quantity changes and amount is not being edited)
  useEffect(() => {
    if (quantityInputFocused && !amountInputFocused && quantity !== '' && fuelPrice > 0) {
      const calculatedAmount = Number(quantity) * fuelPrice;
      setAmount(parseFloat(calculatedAmount.toFixed(2)));
    }
  }, [quantity, fuelPrice, quantityInputFocused, amountInputFocused, setAmount]);

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
          onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
          onFocus={() => setAmountInputFocused(true)}
          onBlur={() => setAmountInputFocused(false)}
          placeholder="Enter amount"
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
          onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
          onFocus={() => setQuantityInputFocused(true)}
          onBlur={() => setQuantityInputFocused(false)}
          placeholder="Enter quantity"
        />
      </div>
    </div>
  );
};
