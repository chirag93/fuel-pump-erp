
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AmountQuantityInputsProps {
  amount: number | string;
  setAmount: (value: number | '') => void;
  quantity: number | string;
  setQuantity: (value: number | '') => void;
}

export const AmountQuantityInputs = ({
  amount,
  setAmount,
  quantity,
  setQuantity
}: AmountQuantityInputsProps) => {
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
          placeholder="Enter amount"
        />
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
          placeholder="Enter quantity"
        />
      </div>
    </div>
  );
};
