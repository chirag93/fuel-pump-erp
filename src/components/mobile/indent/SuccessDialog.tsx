
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { SuccessDetails } from '@/hooks/mobile/useIndentForm';

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  successDetails: SuccessDetails;
}

export const SuccessDialog = ({
  open,
  onOpenChange,
  successDetails
}: SuccessDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-600">
            <Check className="h-5 w-5 mr-2" />
            Indent Recorded Successfully
          </DialogTitle>
          <DialogDescription>
            The indent has been recorded and the transaction has been created.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indent Number:</span>
              <span className="font-medium">{successDetails.indentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{successDetails.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="font-medium">{successDetails.vehicleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Type:</span>
              <span className="font-medium">{successDetails.fuelType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">₹{successDetails.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{successDetails.quantity.toLocaleString()} L</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
