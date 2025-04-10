import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EndShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  staffId: string;
  pumpId: string;
  openingReading: number;
  onComplete: () => void;
}

// Define an interface for the form data to ensure type safety
interface ShiftFormData {
  closing_reading: number;
  cash_remaining: number;
  card_sales: number;
  upi_sales: number;
  cash_sales: number;
  indent_sales: number; // Ensure indent_sales is included in form data
  expenses: number;
}

// Interface for the reading data returned from database
interface ReadingData {
  id?: string;
  shift_id?: string;
  staff_id?: string;
  pump_id?: string;
  opening_reading?: number;
  closing_reading?: number | null;
  cash_given?: number;
  cash_remaining?: number | null;
  card_sales?: number | null;
  upi_sales?: number | null;
  cash_sales?: number | null;
  testing_fuel?: number | null;
  expenses?: number;
  date?: string;
  created_at?: string;
  indent_sales?: number | null; // Ensure indent_sales is included in reading data
}

const EndShiftDialog = ({ 
  open, 
  onOpenChange, 
  shiftId, 
  staffId, 
  pumpId, 
  openingReading, 
  onComplete 
}: EndShiftDialogProps) => {
  const [mode, setMode] = useState<'end-only' | 'end-and-start'>('end-only');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  const [isEditingCompletedShift, setIsEditingCompletedShift] = useState(false);
  const [indentSales, setIndentSales] = useState<number>(0);
  
  const [formData, setFormData] = useState<ShiftFormData>({
    closing_reading: 0,
    cash_remaining: 0,
    card_sales: 0,
    upi_sales: 0,
    cash_sales: 0,
    indent_sales: 0, // Initialize indent sales
    expenses: 0
  });
  
  const [totalSales, setTotalSales] = useState(0);
  const [cashReconciliation, setCashReconciliation] = useState({
    expected: 0,
    difference: 0
  });
  
  const [newShiftData, setNewShiftData] = useState({
    staff_id: '',
    pump_id: pumpId,
    opening_reading: 0, // Will be set to the closing reading of the ending shift
    cash_given: 0,
    date: new Date().toISOString().split('T')[0]
  });
  
  const [staffList, setStaffList] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (open) {
      // Reset form to default values when dialog opens
      if (!isEditingCompletedShift) {
        setFormData({
          closing_reading: 0,
          cash_remaining: 0,
          card_sales: 0,
          upi_sales: 0,
          cash_sales: 0,
          indent_sales: 0,
          expenses: 0
        });
        
        setNewShiftData({
          staff_id: '',
          pump_id: pumpId,
          opening_reading: 0,
          cash_given: 0,
          date: new Date().toISOString().split('T')[0]
        });
        
        // Fetch indent sales for staff if not editing a completed shift
        fetchStaffIndentSales(staffId);
      }
      
      setError(null);
    }
  }, [open, isEditingCompletedShift, pumpId, staffId]);

  const fetchStaffIndentSales = async (staffId: string) => {
    try {
      console.log("Fetching indent sales for staff:", staffId);
      
      // Get the shift start time to find indents during this shift
      const { data: shiftDetail, error: shiftError } = await supabase
        .from('shifts')
        .select('start_time, end_time')
        .eq('id', shiftId)
        .single();
      
      if (shiftError) throw shiftError;
      
      if (!shiftDetail?.start_time) {
        console.log("No start time available for shift");
        return;
      }
      
      // Use end_time if available, otherwise use current time
      const endTime = shiftDetail.end_time || new Date().toISOString();
      
      // Query transactions made by this staff during the shift
      const { data: indentData, error: indentError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('staff_id', staffId)
        .gte('created_at', shiftDetail.start_time)
        .lte('created_at', endTime);
      
      if (indentError) throw indentError;
      
      if (indentData && indentData.length > 0) {
        // Sum up all the indent amounts
        const totalIndentSales = indentData.reduce((sum, transaction) => {
          return sum + (parseFloat(transaction.amount.toString()) || 0);
        }, 0);
        
        console.log(`Found ${indentData.length} indent transactions totaling ₹${totalIndentSales}`);
        
        // Update form data with the indent sales amount
        setIndentSales(totalIndentSales);
        setFormData(prev => ({
          ...prev,
          indent_sales: totalIndentSales
        }));
      } else {
        console.log("No indent transactions found for this staff during the shift");
        setIndentSales(0);
      }
    } catch (error) {
      console.error('Error fetching staff indent sales:', error);
    }
  };

  useEffect(() => {
    if (open && shiftId) {
      const checkShiftStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('shifts')
            .select('status, end_time')
            .eq('id', shiftId)
            .single();
            
          if (error) throw error;
          
          // If shift has end_time and status is completed, we're editing a completed shift
          if (data && data.end_time && data.status === 'completed') {
            setIsEditingCompletedShift(true);
            
            // Load the existing data for this completed shift
            const { data: readingData, error: readingError } = await supabase
              .from('readings')
              .select('*')
              .eq('shift_id', shiftId)
              .single();
              
            if (readingError) throw readingError;
            
            if (readingData) {
              // Handle the case where the expenses field might not exist in older records
              const expensesValue = readingData.expenses !== undefined ? readingData.expenses : 0;
              
              // Handle the case where indent_sales might not exist in older records
              const indentSalesValue = readingData.indent_sales !== undefined ? readingData.indent_sales : 0;
              
              setFormData({
                closing_reading: readingData.closing_reading || 0,
                cash_remaining: readingData.cash_remaining || 0,
                card_sales: readingData.card_sales || 0,
                upi_sales: readingData.upi_sales || 0,
                cash_sales: readingData.cash_sales || 0,
                indent_sales: indentSalesValue,
                expenses: expensesValue
              });
            }
          } else {
            setIsEditingCompletedShift(false);
            // Reset to end-only mode for active shifts by default
            setMode('end-only');
          }
        } catch (err) {
          console.error('Error checking shift status:', err);
          toast({
            title: "Error",
            description: "Failed to check shift status. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      checkShiftStatus();
    }
  }, [open, shiftId]);

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
  
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setStaffList(data);
        }
      } catch (err) {
        console.error('Error fetching staff:', err);
      }
    };
    
    if (open && mode === 'end-and-start' && !isEditingCompletedShift) {
      fetchStaff();
    }
  }, [open, mode, isEditingCompletedShift]);

  useEffect(() => {
    const cardSales = Number(formData.card_sales) || 0;
    const upiSales = Number(formData.upi_sales) || 0;
    const cashSales = Number(formData.cash_sales) || 0;
    const indentSales = Number(formData.indent_sales) || 0;
    setTotalSales(cardSales + upiSales + cashSales + indentSales);
  }, [formData.card_sales, formData.upi_sales, formData.cash_sales, formData.indent_sales]);
  
  useEffect(() => {
    if (formData.closing_reading > 0 && openingReading > 0 && fuelPrice > 0) {
      const fuelSold = formData.closing_reading - openingReading;
      const expectedSales = fuelSold * fuelPrice;
      const expectedCash = formData.cash_sales;
      const actualCash = formData.cash_remaining;
      const expenses = formData.expenses || 0; // Include expenses in calculation
      const difference = actualCash - expectedCash + expenses; // Adjust difference calculation
      
      setCashReconciliation({
        expected: expectedCash,
        difference: difference
      });
    }
  }, [formData.closing_reading, formData.cash_sales, formData.cash_remaining, formData.expenses, openingReading, fuelPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value) || 0
    }));
  };
  
  const handleNewShiftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewShiftData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value) || 0
    }));
  };
  
  const validateForm = () => {
    setError(null);
    
    if (!isEditingCompletedShift) {
      if (!formData.closing_reading || formData.closing_reading <= openingReading) {
        setError("Closing reading must be greater than opening reading");
        return false;
      }
    } else {
      if (!formData.closing_reading || formData.closing_reading <= 0) {
        setError("Please enter a valid closing reading");
        return false;
      }
    }
    
    if (mode === 'end-and-start' && !newShiftData.staff_id) {
      setError("Please select a staff member for the new shift");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isEditingCompletedShift) {
        // Get existing readings to check schema
        const { data: existingReadings, error: readingsCheckError } = await supabase
          .from('readings')
          .select('*')
          .eq('shift_id', shiftId)
          .limit(1);
          
        if (readingsCheckError) {
          throw readingsCheckError;
        }
        
        // Check if indent_sales column exists in the readings table
        const hasIndentSalesColumn = existingReadings && 
          existingReadings.length > 0 && 
          'indent_sales' in existingReadings[0];
        
        // Prepare update data for readings
        const baseUpdateData: Record<string, any> = {
          closing_reading: formData.closing_reading,
          cash_remaining: formData.cash_remaining,
          card_sales: formData.card_sales,
          upi_sales: formData.upi_sales,
          cash_sales: formData.cash_sales,
          expenses: formData.expenses
        };
        
        // Only add indent_sales if the column exists
        if (hasIndentSalesColumn) {
          baseUpdateData.indent_sales = formData.indent_sales;
        }
        
        // Update readings
        const { error: updateError } = await supabase
          .from('readings')
          .update(baseUpdateData)
          .eq('shift_id', shiftId);
          
        if (updateError) {
          throw updateError;
        }
        
        toast({
          title: "Success",
          description: "Shift details updated successfully."
        });
      } else {
        // End the current shift
        const now = new Date().toISOString();
        
        // Update the shift record
        const { error: shiftError } = await supabase
          .from('shifts')
          .update({
            end_time: now,
            status: 'completed',
            cash_remaining: formData.cash_remaining
          })
          .eq('id', shiftId);
          
        if (shiftError) {
          throw shiftError;
        }
        
        // Get existing readings to check schema
        const { data: existingReadings, error: readingsCheckError } = await supabase
          .from('readings')
          .select('*')
          .eq('shift_id', shiftId)
          .limit(1);
          
        if (readingsCheckError) {
          throw readingsCheckError;
        }
        
        // Check if indent_sales column exists in the readings table
        const hasIndentSalesColumn = existingReadings && 
          existingReadings.length > 0 && 
          'indent_sales' in existingReadings[0];
        
        // Prepare update data for readings
        const baseUpdateData: Record<string, any> = {
          closing_reading: formData.closing_reading,
          cash_remaining: formData.cash_remaining,
          card_sales: formData.card_sales,
          upi_sales: formData.upi_sales,
          cash_sales: formData.cash_sales,
          expenses: formData.expenses
        };
        
        // Only add indent_sales if the column exists
        if (hasIndentSalesColumn) {
          baseUpdateData.indent_sales = formData.indent_sales;
        }
        
        // Update readings
        const { error: updateError } = await supabase
          .from('readings')
          .update(baseUpdateData)
          .eq('shift_id', shiftId);
          
        if (updateError) {
          throw updateError;
        }
        
        // If we're also starting a new shift
        if (mode === 'end-and-start' && newShiftData.staff_id) {
          // Get current shift type to determine next shift type
          const { data: currentShift, error: currentShiftError } = await supabase
            .from('shifts')
            .select('shift_type')
            .eq('id', shiftId)
            .single();
            
          if (currentShiftError) {
            throw currentShiftError;
          }
          
          let nextShiftType = 'day'; // Default
          
          // Determine next shift type based on current shift
          if (currentShift) {
            if (currentShift.shift_type === 'morning') {
              nextShiftType = 'evening';
            } else if (currentShift.shift_type === 'evening') {
              nextShiftType = 'night';
            } else if (currentShift.shift_type === 'night') {
              nextShiftType = 'morning';
            } else if (currentShift.shift_type === 'day') {
              nextShiftType = 'night';
            }
          }
          
          // Create a new shift
          const { data: newShift, error: newShiftError } = await supabase
            .from('shifts')
            .insert([{
              staff_id: newShiftData.staff_id,
              shift_type: nextShiftType,
              start_time: now,
              status: 'active'
            }])
            .select();
            
          if (newShiftError) {
            throw newShiftError;
          }
          
          if (!newShift || newShift.length === 0) {
            throw new Error("Failed to create new shift");
          }
          
          // Create associated reading record
          const { error: newReadingError } = await supabase
            .from('readings')
            .insert([{
              shift_id: newShift[0].id,
              staff_id: newShiftData.staff_id,
              pump_id: pumpId,
              date: newShiftData.date,
              opening_reading: formData.closing_reading, // Use closing reading as opening reading
              cash_given: newShiftData.cash_given
            }]);
            
          if (newReadingError) {
            throw newReadingError;
          }
        }
        
        toast({
          title: "Success",
          description: mode === 'end-only' 
            ? "Shift ended successfully." 
            : "Shift ended and new shift started successfully."
        });
      }
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing shift:', error);
      setError(error.message || "Failed to process shift. Please try again.");
      toast({
        title: "Error",
        description: "Failed to process shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fuelLiters = formData.closing_reading - openingReading > 0 
    ? formData.closing_reading - openingReading 
    : 0;
  
  const expectedSalesAmount = fuelLiters * fuelPrice;
  
  return (
    
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditingCompletedShift ? "Edit Completed Shift" : "End Shift"}
          </DialogTitle>
          <DialogDescription>
            {isEditingCompletedShift 
              ? "Update the details of this completed shift."
              : "Enter the closing information to end the current shift."}
          </DialogDescription>
        </DialogHeader>
        
        {!isEditingCompletedShift && (
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'end-only' | 'end-and-start')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="end-only">End Shift Only</TabsTrigger>
              <TabsTrigger value="end-and-start">End & Start New</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
          
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="closing_reading">Closing Reading</Label>
            <Input
              id="closing_reading"
              name="closing_reading"
              type="number"
              value={formData.closing_reading === 0 ? '' : formData.closing_reading}
              onChange={handleInputChange}
            />
            {!isEditingCompletedShift && (
              <p className="text-xs text-muted-foreground">
                Current opening reading: {openingReading}
              </p>
            )}
            {formData.closing_reading > 0 && openingReading > 0 && !isEditingCompletedShift && (
              <p className="text-xs font-medium text-green-600">
                Fuel sold: {fuelLiters.toFixed(2)} liters 
                {fuelPrice > 0 && ` (₹${expectedSalesAmount.toFixed(2)})`}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="card_sales">Card Sales</Label>
              <Input
                id="card_sales"
                name="card_sales"
                type="number"
                value={formData.card_sales === 0 ? '' : formData.card_sales}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-1">
              <Label htmlFor="upi_sales">UPI Sales</Label>
              <Input
                id="upi_sales"
                name="upi_sales"
                type="number"
                value={formData.upi_sales === 0 ? '' : formData.upi_sales}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-1">
              <Label htmlFor="cash_sales">Cash Sales</Label>
              <Input
                id="cash_sales"
                name="cash_sales"
                type="number"
                value={formData.cash_sales === 0 ? '' : formData.cash_sales}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {/* Add Indent Sales field */}
          <div className="grid gap-1">
            <Label htmlFor="indent_sales">Indent Sales</Label>
            <Input
              id="indent_sales"
              name="indent_sales"
              type="number"
              value={formData.indent_sales === 0 ? '' : formData.indent_sales}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground">
              Pre-filled with your recorded indent transactions during this shift
            </p>
          </div>
          
          {/* Total Sales Summary Card */}
          <Card className="mt-4 bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Sales:</span>
                <span className="text-lg font-bold">₹{totalSales.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-sm">
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span>₹{formData.card_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI:</span>
                  <span>₹{formData.upi_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash:</span>
                  <span>₹{formData.cash_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Indent:</span>
                  <span>₹{formData.indent_sales.toLocaleString()}</span>
                </div>
                {!isEditingCompletedShift && (
                  <>
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Add Expenses field */}
          <div className="grid gap-2">
            <Label htmlFor="expenses">Expenses</Label>
            <Input
              id="expenses"
              name="expenses"
              type="number"
              value={formData.expenses === 0 ? '' : formData.expenses}
              onChange={handleInputChange}
              placeholder="Enter expenses amount"
            />
            <p className="text-xs text-muted-foreground">
              Enter any cash expenses that occurred during this shift
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="cash_remaining">Cash Remaining</Label>
            <Input
              id="cash_remaining"
              name="cash_remaining"
              type="number"
              value={formData.cash_remaining === 0 ? '' : formData.cash_remaining}
              onChange={handleInputChange}
            />
          </div>
          
          {/* Cash Reconciliation */}
          {formData.cash_sales > 0 && formData.cash_remaining > 0 && (
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
                  {formData.expenses > 0 && (
                    <div className="flex justify-between">
                      <span>Expenses:</span>
                      <span>₹{formData.expenses.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Actual Cash:</span>
                    <span>₹{formData.cash_remaining.toFixed(2)}</span>
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
        </div>
        
        {!isEditingCompletedShift && mode === 'end-and-start' && (
          <TabsContent value="end-and-start" className="space-y-4 mt-4 border-t pt-4">
            <div className="grid gap-2">
              <Label htmlFor="staff_id">Select Staff for Next Shift</Label>
              <Select 
                value={newShiftData.staff_id}
                onValueChange={(value) => setNewShiftData(prev => ({ ...prev, staff_id: value }))}
              >
                <SelectTrigger id="staff_id">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="cash_given">New Cash Given</Label>
              <Input
                id="cash_given"
                name="cash_given"
                type="number"
                value={newShiftData.cash_given === 0 ? '' : newShiftData.cash_given}
                onChange={handleNewShiftInputChange}
              />
            </div>
          </TabsContent>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isEditingCompletedShift ? 'Update Shift' : 
              mode === 'end-only' ? 'End Shift' : 'End & Start New'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndShiftDialog;
