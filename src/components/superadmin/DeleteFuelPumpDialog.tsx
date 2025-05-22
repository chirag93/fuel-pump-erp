
import React, { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeleteFuelPumpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fuelPump: {
    id: string;
    name: string;
    email: string;
  } | null;
  onDeleted: () => void;
}

export function DeleteFuelPumpDialog({ 
  isOpen, 
  onClose, 
  fuelPump, 
  onDeleted 
}: DeleteFuelPumpDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const handleClose = () => {
    setConfirmationText('');
    setStep(1);
    setDeleteConfirmed(false);
    onClose();
  };

  const proceedToNextStep = () => {
    if (step === 1 && confirmationText === fuelPump?.name) {
      setStep(2);
      setConfirmationText('');
    } else if (step === 2 && confirmationText === 'DELETE') {
      setStep(3);
      setConfirmationText('');
    } else if (step === 3 && confirmationText === fuelPump?.email) {
      setDeleteConfirmed(true);
    }
  };

  const handleDeleteFuelPump = async () => {
    if (!fuelPump) return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase.functions.invoke('delete-fuel-pump', {
        body: { 
          fuelPumpId: fuelPump.id 
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Fuel Pump Deleted",
        description: `${fuelPump.name} has been deleted successfully along with all associated data.`
      });
      
      handleClose();
      onDeleted();
    } catch (error: any) {
      console.error('Error deleting fuel pump:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete fuel pump",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStepContent = () => {
    if (!fuelPump) return null;

    switch (step) {
      case 1:
        return (
          <>
            <AlertDialogDescription className="mb-4">
              This action is irreversible. All data associated with this fuel pump including staff, customers, 
              transactions, shifts, and all other related records will be permanently deleted.
            </AlertDialogDescription>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                To proceed, please type the name of the fuel pump: <span className="font-semibold">{fuelPump.name}</span>
              </p>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Enter fuel pump name"
                className="mb-4"
              />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <AlertDialogDescription className="mb-4">
              <span className="font-bold text-destructive">WARNING:</span> You are about to delete <span className="font-semibold">{fuelPump.name}</span> and <span className="font-bold">ALL</span> of its data including:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Staff accounts and records</li>
                <li>Customer data and transactions</li>
                <li>Fuel inventory and readings</li>
                <li>Shift information and financial records</li>
                <li>Settings and configurations</li>
              </ul>
            </AlertDialogDescription>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                To proceed, please type <span className="font-bold">DELETE</span> in capital letters:
              </p>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="mb-4"
              />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <AlertDialogDescription className="mb-4">
              <span className="font-bold text-destructive">FINAL WARNING:</span> This is your last chance to cancel.
              <p className="mt-2">
                This will immediately revoke access for all users of <span className="font-semibold">{fuelPump.name}</span> and permanently delete all data.
              </p>
              <p className="mt-2">
                This action <span className="underline font-bold">CANNOT</span> be undone.
              </p>
            </AlertDialogDescription>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                To confirm final deletion, please type the email address: <span className="font-semibold">{fuelPump.email}</span>
              </p>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Enter fuel pump email"
                className="mb-4"
              />
            </div>
            {deleteConfirmed && (
              <div className="rounded-md bg-destructive/10 p-3 text-center">
                <p className="text-sm text-destructive font-medium">
                  All confirmations complete. Click "Delete Fuel Pump" below to permanently delete this fuel pump and all associated data.
                </p>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return confirmationText !== fuelPump?.name;
    if (step === 2) return confirmationText !== 'DELETE';
    if (step === 3) return confirmationText !== fuelPump?.email;
    return true;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Delete Fuel Pump{step > 1 ? ` - Step ${step} of 3` : ''}
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        {getStepContent()}

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <div className="flex flex-row justify-start mt-2 sm:mt-0">
            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          </div>
          <div className="flex flex-row justify-end gap-2">
            {!deleteConfirmed && step < 3 && (
              <Button 
                onClick={proceedToNextStep} 
                disabled={isNextDisabled()}
                variant="outline"
              >
                Next
              </Button>
            )}
            {step === 3 && !deleteConfirmed && (
              <Button 
                onClick={proceedToNextStep} 
                disabled={isNextDisabled()}
                variant="outline"
              >
                Confirm
              </Button>
            )}
            {deleteConfirmed && (
              <AlertDialogAction 
                onClick={handleDeleteFuelPump}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Fuel Pump"}
              </AlertDialogAction>
            )}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
