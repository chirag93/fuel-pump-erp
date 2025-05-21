
import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

interface DeleteShiftDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  staffName: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteShiftDialog({ 
  isOpen, 
  onOpenChange, 
  shiftId, 
  staffName, 
  onConfirm, 
  isDeleting 
}: DeleteShiftDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Active Shift</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the active shift for {staffName}? 
            This action cannot be undone and all associated readings will be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Shift"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
