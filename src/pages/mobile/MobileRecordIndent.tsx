
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FuelTransactionForm } from '@/components/indent/FuelTransactionForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MobileRecordIndent = () => {
  const { toast } = useToast();
  const [fuelType, setFuelType] = useState('Petrol');
  const [amount, setAmount] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [date, setDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<Array<{id: string, name: string}>>([]);
  const [indentNumber, setIndentNumber] = useState('');
  const [indentNumberError, setIndentNumberError] = useState('');
  
  // Fetch staff data on component mount
  useEffect(() => {
    const fetchStaff = async () => {
      console.info('Fetching staff data...');
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('is_active', true);
        
      if (error) {
        console.error('Error fetching staff:', error);
        return;
      }
      
      if (data) {
        console.info(`Staff data fetched: ${data.length} records`);
        setStaff(data);
        // If staff exists, select the first one by default
        if (data.length > 0) {
          setSelectedStaff(data[0].id);
        }
      }
    };
    
    fetchStaff();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaff) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive"
      });
      return;
    }
    
    if (!indentNumber.trim()) {
      setIndentNumberError('Please enter an indent number');
      return;
    } else {
      setIndentNumberError('');
    }
    
    // Additional validation to ensure amount and quantity are valid numbers
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, check if this indent number already exists
      const { data: existingIndent, error: checkError } = await supabase
        .from('indents')
        .select('id')
        .eq('indent_number', indentNumber);
        
      if (checkError) throw checkError;
      
      if (existingIndent && existingIndent.length > 0) {
        toast({
          title: "Error",
          description: "This indent number is already in use",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Generate a unique ID for the indent
      const indentId = `IND-${Date.now()}`;
      
      console.log("Creating indent with data:", {
        id: indentId,
        indent_number: indentNumber,
        fuel_type: fuelType,
        amount,
        quantity,
        discount_amount: discountAmount,
        date: date.toISOString().split('T')[0],
        source: 'mobile',
        approval_status: 'pending'
      });
      
      // Create the indent record
      const { error: indentError } = await supabase
        .from('indents')
        .insert({
          id: indentId,
          indent_number: indentNumber,
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          discount_amount: discountAmount,
          date: date.toISOString().split('T')[0],
          source: 'mobile',
          approval_status: 'pending',
          // Using placeholder UUIDs for required fields
          customer_id: '00000000-0000-0000-0000-000000000000',
          vehicle_id: '00000000-0000-0000-0000-000000000000'
        });
        
      if (indentError) {
        console.error('Error creating indent:', indentError);
        throw indentError;
      }
      
      console.log("Creating transaction with data:", {
        id: `TR-${Date.now()}`,
        staff_id: selectedStaff,
        date: date.toISOString().split('T')[0],
        fuel_type: fuelType,
        amount,
        quantity,
        payment_method: 'Cash',
        discount_amount: discountAmount,
        source: 'mobile',
        indent_id: indentId,
        approval_status: 'pending'
      });
      
      // Create the transaction record linked to the indent
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: `TR-${Date.now()}`,
          staff_id: selectedStaff,
          date: date.toISOString().split('T')[0],
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          payment_method: 'Cash',
          discount_amount: discountAmount,
          source: 'mobile',
          indent_id: indentId,
          approval_status: 'pending',
          // Using the same placeholder UUIDs
          customer_id: '00000000-0000-0000-0000-000000000000',
          vehicle_id: '00000000-0000-0000-0000-000000000000'
        });
        
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }
      
      toast({
        title: "Transaction recorded",
        description: "The transaction has been saved and is pending approval."
      });
      
      // Reset form
      setAmount(0);
      setQuantity(0);
      setDiscountAmount(0);
      setIndentNumber('');
      
      // Clear any existing errors
      setIndentNumberError('');
      
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center mb-4">
        <Link to="/mobile">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Record Indent</h1>
      </div>
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">New Transaction</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <Label htmlFor="indentNumber">Indent Number</Label>
              <Input
                id="indentNumber"
                value={indentNumber}
                onChange={(e) => setIndentNumber(e.target.value)}
                className={indentNumberError ? "border-red-500" : ""}
                placeholder="Enter indent number"
              />
              {indentNumberError && (
                <p className="text-xs text-red-500 mt-1">{indentNumberError}</p>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="z-10">
                  <Label htmlFor="staffMember">Staff Member</Label>
                  <select 
                    id="staffMember"
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {staff.length === 0 ? (
                      <option value="" disabled>No staff members found</option>
                    ) : (
                      staff.map((member) => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))
                    )}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <select
                    id="fuelType"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    id="date"
                    value={date.toISOString().split('T')[0]}
                    onChange={(e) => setDate(new Date(e.target.value))}
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
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-4"
            >
              {isSubmitting ? 'Recording...' : 'Record Indent'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileRecordIndent;
