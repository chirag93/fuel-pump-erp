
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface FuelTransactionFormProps {
  fuelType: string;
  setFuelType: (type: string) => void;
  amount: number;
  setAmount: (amount: number) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  discountAmount: number;
  setDiscountAmount: (discountAmount: number) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  staff: { id: string; name: string }[];
  selectedStaff: string;
  setSelectedStaff: (staffId: string) => void;
}

export const FuelTransactionForm = ({
  fuelType,
  setFuelType,
  amount,
  setAmount,
  quantity,
  setQuantity,
  discountAmount,
  setDiscountAmount,
  date,
  setDate,
  isSubmitting,
  onSubmit,
  staff,
  selectedStaff,
  setSelectedStaff
}: FuelTransactionFormProps) => {
  const [fuelPrices, setFuelPrices] = useState<{[key: string]: number}>({
    Petrol: 0,
    Diesel: 0
  });

  // Fetch fuel prices when component mounts or fuel type changes
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

  // Auto-calculate amount when quantity or fuel type changes
  useEffect(() => {
    if (quantity > 0 && fuelPrices[fuelType]) {
      const calculatedAmount = quantity * fuelPrices[fuelType];
      setAmount(calculatedAmount);
    }
  }, [quantity, fuelType, fuelPrices, setAmount]);

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value) || 0;
    setQuantity(newQuantity);
  };

  // Handle amount change (manual override)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(e.target.value) || 0);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="z-10">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
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
        <div>
          <Label htmlFor="discountAmount">Discount Amount (₹)</Label>
          <Input
            type="number"
            id="discountAmount"
            value={discountAmount === 0 ? '' : discountAmount}
            onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter discount amount"
          />
        </div>
      </div>
    </div>
  );
};
