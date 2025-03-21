
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Indent, Transaction } from '@/integrations/supabase/client';
import { generateBill } from '@/utils/billGenerator';
import { supabase } from '@/integrations/supabase/client';

interface BillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  indent?: Indent;
  vehicleNumber?: string;
  customerName?: string;
  onSuccess?: () => void;
}

interface BusinessInfo {
  business_name: string;
  gst_number: string;
  address: string;
}

const BillPreviewDialog = ({
  open,
  onOpenChange,
  transaction,
  indent,
  vehicleNumber,
  customerName,
  onSuccess
}: BillPreviewDialogProps) => {
  const [fuelType, setFuelType] = useState(transaction.fuel_type);
  const [quantity, setQuantity] = useState(transaction.quantity);
  const [amount, setAmount] = useState(transaction.amount);
  const [date, setDate] = useState<Date>(new Date(transaction.date));
  const [isGenerating, setIsGenerating] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: 'Fuel Station',
    gst_number: 'Not Available',
    address: 'Address not available'
  });

  useEffect(() => {
    // Fetch business details
    const fetchBusinessInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .single();

        if (error) throw error;
        
        if (data) {
          setBusinessInfo({
            business_name: data.business_name,
            gst_number: data.gst_number || 'Not Available',
            address: data.address || 'Address not available'
          });
        }
      } catch (error) {
        console.error('Error fetching business info:', error);
      }
    };

    if (open) {
      fetchBusinessInfo();
      setFuelType(transaction.fuel_type);
      setQuantity(transaction.quantity);
      setAmount(transaction.amount);
      setDate(new Date(transaction.date));
    }
  }, [open, transaction]);

  const handleGenerateBill = async () => {
    setIsGenerating(true);
    
    try {
      const result = await generateBill({
        transaction,
        indent,
        businessInfo,
        vehicleNumber,
        customerName,
        customizations: {
          fuelType,
          quantity,
          amount,
          date
        }
      });
      
      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      
      if (result.success && onSuccess) {
        onSuccess();
        onOpenChange(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateRatePerLiter = () => {
    return quantity > 0 ? amount / quantity : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Edit Bill Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Input 
                id="fuelType" 
                value={fuelType} 
                onChange={(e) => setFuelType(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (L)</Label>
              <Input 
                id="quantity" 
                type="number" 
                value={quantity} 
                onChange={(e) => {
                  const newQuantity = parseFloat(e.target.value);
                  setQuantity(newQuantity);
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input 
                id="amount" 
                type="number" 
                value={amount} 
                onChange={(e) => {
                  const newAmount = parseFloat(e.target.value);
                  setAmount(newAmount);
                }}
              />
            </div>

            <div className="pt-2">
              <Label>Rate per liter: INR {calculateRatePerLiter().toFixed(2)}</Label>
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Bill Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg">{businessInfo.business_name}</p>
                  <p className="text-sm">{businessInfo.address}</p>
                  <p className="text-sm">GSTIN: {businessInfo.gst_number}</p>
                </div>
                
                <div className="text-center pt-2 pb-3 border-b">
                  <h2 className="font-bold">FUEL BILL</h2>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Date:</span> {format(date, 'dd/MM/yyyy')}</p>
                  {customerName && (
                    <p><span className="font-semibold">Customer:</span> {customerName}</p>
                  )}
                  {vehicleNumber && (
                    <p><span className="font-semibold">Vehicle:</span> {vehicleNumber}</p>
                  )}
                </div>
                
                <table className="w-full text-sm mt-4">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border-t">{fuelType}</td>
                      <td className="p-2 border-t text-right">{quantity.toFixed(2)} L</td>
                      <td className="p-2 border-t text-right">INR {calculateRatePerLiter().toFixed(2)}</td>
                      <td className="p-2 border-t text-right">INR {amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="p-2 border-t text-right font-semibold">Total:</td>
                      <td className="p-2 border-t text-right font-semibold">INR {amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <div className="text-sm pt-4">
                  <p><span className="font-semibold">Payment Method:</span> {transaction.payment_method}</p>
                </div>
                
                <div className="pt-8 flex justify-end">
                  <div className="text-center">
                    <div className="border-t border-gray-400 w-32"></div>
                    <p className="text-sm pt-1">Authorized Signature</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerateBill} 
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillPreviewDialog;
