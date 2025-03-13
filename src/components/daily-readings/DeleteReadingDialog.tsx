
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

interface DeleteReadingDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedReadingDate: string | null;
  selectedReadingFuelType: string | null;
  handleDeleteReading: () => Promise<void>;
}

const DeleteReadingDialog = ({
  isOpen,
  setIsOpen,
  selectedReadingDate,
  selectedReadingFuelType,
  handleDeleteReading
}: DeleteReadingDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the reading for {selectedReadingFuelType} on {selectedReadingDate && new Date(selectedReadingDate).toLocaleDateString()}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteReading}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteReadingDialog;
