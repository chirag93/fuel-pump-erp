
import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EndShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: {
    id: string;
    staff_id: string;
    staff_name: string;
    pump_id: string;
    opening_reading: number;
    shift_type: string;
  };
  onShiftEnded: () => void;
}

export function NewEndShiftDialog({ isOpen, onClose, shiftData, onShiftEnded }: EndShiftDialogProps) {
  const [closingReading, setClosingReading] = useState<string>('');
  const [cashRemaining, setCashRemaining] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [createNewShift, setCreateNewShift] = useState(true);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  
  // Add sales fields
  const [cardSales, setCardSales] = useState<string>('');
  const [upiSales, setUpiSales] = useState<string>('');
  const [cashSales, setCashSales] = useState<string>('');
  const [totalSales, setTotalSales] = useState<number>(0);
  const [cashReconciliation, setCashReconciliation] = useState({
    expected: 0,
    difference: 0
  });

  // Calculate total sales whenever sales input changes
  useEffect(() => {
    const card = Number(cardSales) || 0;
    const upi = Number(upiSales) || 0;
    const cash = Number(cashSales) || 0;
    setTotalSales(card + upi + cash);
  }, [cardSales, upiSales, cashSales]);
  
  // Fetch fuel price for calculations
  useEffect(() => {
    const fetchFuelPrice = async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('current_price')
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setFuelPrice(data[0].current_price);
        }
      } catch (err) {
        console.error('Error fetching fuel price:', err);
      }
    };
    
    fetchFuelPrice();
  }, []);
  
  // Calculate cash reconciliation
  useEffect(() => {
    if (Number(closingReading) > 0 && shiftData?.opening_reading > 0 && fuelPrice > 0) {
      const fuelSold = Number(closingReading) - shiftData.opening_reading;
      const expectedCash = Number(cashSales) || 0;
      const actualCash = Number(cashRemaining) || 0;
      const difference = actualCash - expectedCash;
      
      setCashReconciliation({
        expected: expectedCash,
        difference: difference
      });
    }
  }, [closingReading, cashSales, cashRemaining, shiftData?.opening_reading, fuelPrice]);

  // Load staff list
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, role, assigned_pumps')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          // Filter to only show staff who are assigned to this pump
          const filteredStaff = data.filter(s => {
            // If assigned_pumps is an array, check if it includes the current pump
            if (Array.isArray(s.assigned_pumps)) {
              return s.assigned_pumps.includes(shiftData.pump_id);
            }
            // For backward compatibility, check if it's JSON
            if (typeof s.assigned_pumps === 'object') {
              // Fix: Using proper JSON handling instead of calling it
              const pumpArray = s.assigned_pumps as string[];
              return pumpArray.includes(shiftData.pump_id);
            }
            return false;
          });
          
          setStaff(filteredStaff);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error loading staff",
          description: "Could not load staff list. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen, shiftData?.pump_id]);

  const validateForm = () => {
    setError(null);
    
    if (!closingReading || Number(closingReading) <= 0) {
      setError('Please enter a valid closing reading');
      return false;
    }
    
    if (Number(closingReading) <= shiftData?.opening_reading) {
      setError('Closing reading must be greater than opening reading');
      return false;
    }
    
    if (!cashRemaining || Number(cashRemaining) < 0) {
      setError('Please enter a valid cash remaining amount');
      return false;
    }
    
    if (createNewShift && !selectedStaff) {
      setError('Please select a staff member for the new shift');
      return false;
    }
    
    return true;
  };

  const handleEndShift = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const now = new Date();
      
      // 1. Update current shift to mark it as completed
      const { error: updateShiftError } = await supabase
        .from('shifts')
        .update({
          end_time: now.toISOString(),
          status: 'completed',
          cash_remaining: Number(cashRemaining)
        })
        .eq('id', shiftData.id);
      
      if (updateShiftError) throw updateShiftError;
      
      // 2. Update readings with closing reading and sales data
      const { error: updateReadingError } = await supabase
        .from('readings')
        .update({
          closing_reading: Number(closingReading),
          card_sales: Number(cardSales) || 0,
          upi_sales: Number(upiSales) || 0,
          cash_sales: Number(cashSales) || 0,
          cash_remaining: Number(cashRemaining)
        })
        .eq('shift_id', shiftData.id);
      
      if (updateReadingError) throw updateReadingError;
      
      // 3. Create new shift if required
      if (createNewShift && selectedStaff) {
        // Determine next shift type based on current shift
        let nextShiftType = 'day'; // Default
        
        if (shiftData.shift_type === 'morning') {
          nextShiftType = 'evening';
        } else if (shiftData.shift_type === 'evening') {
          nextShiftType = 'night';
        } else if (shiftData.shift_type === 'night') {
          nextShiftType = 'morning';
        } else if (shiftData.shift_type === 'day') {
          nextShiftType = 'night';
        }
        
        // Create new shift
        const { data: newShiftData, error: newShiftError } = await supabase
          .from('shifts')
          .insert([{
            staff_id: selectedStaff,
            shift_type: nextShiftType,
            start_time: now.toISOString(),
            status: 'active'
          }])
          .select();
        
        if (newShiftError) throw newShiftError;
        
        if (newShiftData && newShiftData.length > 0) {
          // Create new reading for the new shift
          const { error: newReadingError } = await supabase
            .from('readings')
            .insert([{
              shift_id: newShiftData[0].id,
              staff_id: selectedStaff,
              pump_id: shiftData.pump_id,
              date: now.toISOString().split('T')[0],
              opening_reading: Number(closingReading)
            }]);
          
          if (newReadingError) throw newReadingError;
        }
      }
      
      toast({
        title: "Shift ended successfully",
        description: createNewShift ? 
          "Current shift ended and new shift started successfully" : 
          "Shift ended successfully",
      });
      
      onShiftEnded();
      onClose();
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({
        title: "Error ending shift",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate fuel quantity sold
  const fuelLiters = Number(closingReading) - shiftData?.opening_reading > 0 
    ? Number(closingReading) - shiftData?.opening_reading 
    : 0;

  // Calculate expected sales amount
  const expectedSalesAmount = fuelLiters * fuelPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
          <DialogDescription>
            You are ending {shiftData?.staff_name}'s {shiftData?.shift_type} shift on {shiftData?.pump_id}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="closingReading">Closing Reading</Label>
            <Input
              id="closingReading"
              type="number"
              value={closingReading}
              onChange={(e) => setClosingReading(e.target.value)}
              placeholder="Enter closing reading"
              min={shiftData?.opening_reading + 1 || 0}
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Opening reading: {shiftData?.opening_reading || 0}
            </p>
            {Number(closingReading) > 0 && shiftData?.opening_reading > 0 && (
              <p className="text-xs font-medium text-green-600">
                Fuel sold: {fuelLiters.toFixed(2)} liters
                {fuelPrice > 0 && ` (₹${expectedSalesAmount.toFixed(2)})`}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="cardSales">Card Sales (₹)</Label>
              <Input
                id="cardSales"
                type="number"
                value={cardSales}
                onChange={(e) => setCardSales(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div className="grid gap-1">
              <Label htmlFor="upiSales">UPI Sales (₹)</Label>
              <Input
                id="upiSales"
                type="number"
                value={upiSales}
                onChange={(e) => setUpiSales(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div className="grid gap-1">
              <Label htmlFor="cashSales">Cash Sales (₹)</Label>
              <Input
                id="cashSales"
                type="number"
                value={cashSales}
                onChange={(e) => setCashSales(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
          
          {/* Total Sales Summary Card */}
          <Card className="mt-2 bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Sales:</span>
                <span className="text-lg font-bold">₹{totalSales.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-sm">
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span>₹{Number(cardSales).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI:</span>
                  <span>₹{Number(upiSales).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash:</span>
                  <span>₹{Number(cashSales).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t">
                  <span>Fuel Sold:</span>
                  <span>{fuelLiters.toFixed(2)} L</span>
                </div>
                {fuelPrice > 0 && (
                  <div className="flex justify-between">
                    <span>Expected Amount:</span>
                    <span>₹{expectedSalesAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-2">
            <Label htmlFor="cashRemaining">Cash Remaining (₹)</Label>
            <Input
              id="cashRemaining"
              type="number"
              value={cashRemaining}
              onChange={(e) => setCashRemaining(e.target.value)}
              placeholder="Enter cash remaining amount"
              min="0"
              step="0.01"
            />
          </div>
          
          {/* Cash Reconciliation */}
          {Number(cashSales) > 0 && Number(cashRemaining) > 0 && (
            <Card className={`mt-1 ${Math.abs(cashReconciliation.difference) > 10 ? 'bg-red-50' : 'bg-green-50'}`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Cash Reconciliation</span>
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Expected Cash:</span>
                    <span>₹{cashReconciliation.expected.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual Cash:</span>
                    <span>₹{Number(cashRemaining).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Difference:</span>
                    <span className={cashReconciliation.difference < 0 ? 'text-red-600' : 'text-green-600'}>
                      ₹{cashReconciliation.difference.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="createNewShift" 
              checked={createNewShift} 
              onCheckedChange={(checked) => {
                setCreateNewShift(checked === true);
              }}
            />
            <Label htmlFor="createNewShift" className="cursor-pointer">
              Create new shift for this pump
            </Label>
          </div>
          
          {createNewShift && (
            <div className="grid gap-2">
              <Label htmlFor="newStaff">Assign Staff for Next Shift</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger id="newStaff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleEndShift} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'End Shift'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
