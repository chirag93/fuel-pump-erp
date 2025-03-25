
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Transaction, Indent } from '@/integrations/supabase/client';

interface ApprovalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: Transaction | Indent | null;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  isProcessing: boolean;
  actionType: 'approve' | 'reject';
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedItem,
  notes,
  onNotesChange,
  onConfirm,
  isProcessing,
  actionType
}) => {
  // Function to check if an item is an Indent
  const isIndentItem = (item: any): item is Indent => {
    if (!item) return false;
    return 'indent_number' in item;
  };

  const itemType = selectedItem ? (isIndentItem(selectedItem) ? 'indent' : 'transaction') : '';
  const isRejection = actionType === 'reject';
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'approve' ? 'Approve' : 'Reject'} {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            {isRejection 
              ? `Please provide a reason for rejecting this ${itemType}.`
              : `Are you sure you want to approve this ${itemType}?`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="approvalNotes">
              {isRejection ? 'Reason for Rejection' : 'Notes (Optional)'}
            </Label>
            <Textarea
              id="approvalNotes"
              placeholder={isRejection ? "Enter the reason for rejection" : "Add any notes about this approval"}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              required={isRejection}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={onConfirm} 
            disabled={isProcessing || (isRejection && !notes.trim())}
            variant={isRejection ? "destructive" : "default"}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (actionType === 'approve' ? "Approve" : "Reject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalDialog;
