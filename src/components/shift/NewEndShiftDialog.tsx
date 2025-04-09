import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectedShiftData, ShiftReading } from '@/types/shift';

type EndShiftFormData = {
  closingReadings: {
    [fuelType: string]: {
      opening_reading: number;
      closing_reading: number;
    }
  };
  cash_remaining: number;
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  testing_fuel: number;
  expenses: number;
  consumable_expenses: number;
};

interface ReadingData {
  id?: string;
  fuel_type: string;
  opening_reading: number;
  closing_reading: number | null;
  shift_id?: string;
  staff_id?: string;
  pump_id?: string;
  date?: string;
  cash_given?: number;
  cash_remaining?: number;
  card_sales?: number;
  upi_sales?: number;
  cash_sales?: number;
  testing_fuel?: number;
  expenses?: number;
  consumable_expenses?: number;
  created_at?: string;
  fuel_pump_id?: string;
}

interface NewEndShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: SelectedShiftData;
  onShiftEnded: () => void;
}

export function NewEndShiftDialog({
  isOpen,
  onClose,
  shiftData,
  onShiftEnded
}: NewEndShiftDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [readings, setReadings] = useState<ShiftReading[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<EndShiftFormData>({
    closingReadings: {},
    cash_remaining: 0,
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    testing_fuel: 0,
    expenses: 0,
    consumable_expenses: 0
  });

  useEffect(() => {
    if (isOpen && shiftData) {
      fetchShiftReadings();
    }
  }, [isOpen, shiftData]);

  const fetchShiftReadings = async () => {
    try {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('shift_id', shiftData.id);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Process the readings data with explicit typing
        const shiftReadings = data.map((reading: ReadingData) => ({
          fuel_type: reading.fuel_type || 'Unknown',
          opening_reading: reading.opening_reading,
          closing_reading: reading.closing_reading || 0
        }));
        
        setReadings(shiftReadings);
        
        // Initialize closing readings form
        const initialClosingReadings: {[key: string]: any} = {};
        shiftReadings.forEach(reading => {
          initialClosingReadings[reading.fuel_type] = {
            opening_reading: reading.opening_reading,
            closing_reading: reading.closing_reading || reading.opening_reading
          };
        });
        
        setFormData(prev => ({
          ...prev,
          closingReadings: initialClosingReadings
        }));
      }
    } catch (error) {
      console.error('Error fetching shift readings:', error);
      toast({
        title: "Error",
        description: "Failed to load shift readings",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: parseFloat(value) || 0
    });
  };
  
  const handleReadingChange = (fuelType: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      closingReadings: {
        ...prev.closingReadings,
        [fuelType]: {
          ...prev.closingReadings[fuelType],
          closing_reading: parseFloat(value) || 0
        }
      }
    }));
  };

  const calculateTotals = () => {
    // Calculate total sales
    const totalSales = formData.card_sales + formData.upi_sales + formData.cash_sales;
    
    // Calculate total liters dispensed for all fuel types
    let totalLiters = 0;
    
    Object.keys(formData.closingReadings).forEach(fuelType => {
      const reading = formData.closingReadings[fuelType];
      totalLiters += Math.max(0, reading.closing_reading - reading.opening_reading);
    });
    
    return {
      totalSales,
      totalLiters
    };
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      
      // Validate closing readings are greater than opening
      let hasInvalidReading = false;
      Object.keys(formData.closingReadings).forEach(fuelType => {
        const reading = formData.closingReadings[fuelType];
        if (reading.closing_reading < reading.opening_reading) {
          hasInvalidReading = true;
        }
      });
      
      if (hasInvalidReading) {
        toast({
          title: "Invalid readings",
          description: "Closing readings cannot be less than opening readings",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // 1. Update shift status
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          cash_remaining: formData.cash_remaining
        })
        .eq('id', shiftData.id);
        
      if (shiftError) throw shiftError;
      
      // 2. Update readings for each fuel type
      for (const fuelType of Object.keys(formData.closingReadings)) {
        const reading = formData.closingReadings[fuelType];
        
        const { error: readingError } = await supabase
          .from('readings')
          .update({
            closing_reading: reading.closing_reading,
            cash_remaining: formData.cash_remaining,
            card_sales: formData.card_sales,
            upi_sales: formData.upi_sales,
            cash_sales: formData.cash_sales,
            testing_fuel: formData.testing_fuel,
            expenses: formData.expenses,
            consumable_expenses: formData.consumable_expenses
          })
          .eq('shift_id', shiftData.id)
          .eq('fuel_type', fuelType);
          
        if (readingError) throw readingError;
      }
      
      toast({
        title: "Success",
        description: "Shift ended successfully"
      });
      
      onShiftEnded();
      onClose();
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error",
        description: "Failed to end shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { totalSales, totalLiters } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <h3 className="font-semibold text-lg">Shift Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Staff:</p>
                <p className="font-medium">{shiftData.staff_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pump:</p>
                <p className="font-medium">{shiftData.pump_id}</p>
              </div>
            </div>
          </div>
          
          {/* Readings Section */}
          <div className="grid gap-4">
            <h3 className="font-semibold">Meter Readings</h3>
            {Object.keys(formData.closingReadings).map(fuelType => {
              const reading = formData.closingReadings[fuelType];
              return (
                <div key={fuelType} className="grid gap-2">
                  <Label>{fuelType}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Opening Reading</p>
                      <Input 
                        value={reading.opening_reading}
                        disabled
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Closing Reading</p>
                      <Input
                        type="number"
                        value={reading.closing_reading}
                        onChange={(e) => handleReadingChange(fuelType, e.target.value)}
                        min={reading.opening_reading}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-right">
                    Total: {Math.max(0, reading.closing_reading - reading.opening_reading)} liters
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* Sales Section */}
          <div className="grid gap-4">
            <h3 className="font-semibold">Sales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card_sales">Card Sales (INR)</Label>
                <Input
                  id="card_sales"
                  type="number"
                  value={formData.card_sales || ''}
                  onChange={(e) => handleInputChange('card_sales', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="upi_sales">UPI Sales (INR)</Label>
                <Input
                  id="upi_sales"
                  type="number"
                  value={formData.upi_sales || ''}
                  onChange={(e) => handleInputChange('upi_sales', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cash_sales">Cash Sales (INR)</Label>
                <Input
                  id="cash_sales"
                  type="number"
                  value={formData.cash_sales || ''}
                  onChange={(e) => handleInputChange('cash_sales', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testing_fuel">Testing Fuel (liters)</Label>
                <Input
                  id="testing_fuel"
                  type="number"
                  value={formData.testing_fuel || ''}
                  onChange={(e) => handleInputChange('testing_fuel', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Expenses Section */}
          <div className="grid gap-4">
            <h3 className="font-semibold">Expenses</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expenses">Expenses (INR)</Label>
                <Input
                  id="expenses"
                  type="number"
                  value={formData.expenses || ''}
                  onChange={(e) => handleInputChange('expenses', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="consumable_expenses">Consumable Expenses (INR)</Label>
                <Input
                  id="consumable_expenses"
                  type="number"
                  value={formData.consumable_expenses || ''}
                  onChange={(e) => handleInputChange('consumable_expenses', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Cash Section */}
          <div>
            <Label htmlFor="cash_remaining">Cash Remaining (INR)</Label>
            <Input
              id="cash_remaining"
              type="number"
              value={formData.cash_remaining || ''}
              onChange={(e) => handleInputChange('cash_remaining', e.target.value)}
            />
          </div>
          
          {/* Summary */}
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total Sales:</div>
              <div className="text-right font-medium">INR {totalSales.toFixed(2)}</div>
              
              <div>Total Liters:</div>
              <div className="text-right font-medium">{totalLiters.toFixed(2)} L</div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "End Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
