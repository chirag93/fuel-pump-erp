
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  onSubmit
}: FuelTransactionFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            type="number"
            id="amount"
            value={amount === 0 ? '' : amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter amount"
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity (L)</Label>
          <Input
            type="number"
            id="quantity"
            value={quantity === 0 ? '' : quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            placeholder="Enter quantity"
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
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Recording...
          </>
        ) : (
          'Record Indent'
        )}
      </Button>
    </form>
  );
};
