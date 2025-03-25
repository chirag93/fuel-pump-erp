
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FuelTransactionForm } from '@/components/indent/FuelTransactionForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

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
  
  // Fetch staff data on component mount
  React.useEffect(() => {
    const fetchStaff = async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
        .eq('is_active', true);
        
      if (error) {
        console.error('Error fetching staff:', error);
        return;
      }
      
      if (data) {
        setStaff(data);
      }
    };
    
    fetchStaff();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
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
          source: 'mobile'
        });
        
      if (error) throw error;
      
      toast({
        title: "Transaction recorded",
        description: "The transaction has been saved successfully."
      });
      
      // Reset form
      setAmount(0);
      setQuantity(0);
      setDiscountAmount(0);
      setSelectedStaff('');
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
          
          <FuelTransactionForm 
            fuelType={fuelType}
            setFuelType={setFuelType}
            amount={amount}
            setAmount={setAmount}
            quantity={quantity}
            setQuantity={setQuantity}
            discountAmount={discountAmount}
            setDiscountAmount={setDiscountAmount}
            date={date}
            setDate={setDate}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            staff={staff}
            selectedStaff={selectedStaff}
            setSelectedStaff={setSelectedStaff}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileRecordIndent;
