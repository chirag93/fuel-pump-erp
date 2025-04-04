
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import DateRangeSelector from './DateRangeSelector';
import { useState } from 'react';
import InvoiceDateRangeDialog from './InvoiceDateRangeDialog';
import { Customer } from '@/integrations/supabase/client';

interface TransactionActionsProps {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  resetDateRange: () => void;
  onGenerateInvoice: (dateRange: DateRange) => void;
  isGeneratingInvoice: boolean;
  onRecordPayment: () => void;
  customer: Customer;
}

const TransactionActions = ({
  dateRange,
  setDateRange,
  resetDateRange,
  onGenerateInvoice,
  isGeneratingInvoice,
  onRecordPayment,
  customer
}: TransactionActionsProps) => {
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  
  const handleGenerateInvoice = (selectedDateRange: DateRange) => {
    onGenerateInvoice(selectedDateRange);
    setIsInvoiceDialogOpen(false);
  };

  return (
    <div className="flex space-x-2">
      <DateRangeSelector 
        dateRange={dateRange}
        setDateRange={setDateRange}
        resetDateRange={resetDateRange}
      />
      
      <Button 
        onClick={() => setIsInvoiceDialogOpen(true)} 
        variant="outline"
        className="gap-1"
        disabled={isGeneratingInvoice}
      >
        <FileText className="h-4 w-4" />
        {isGeneratingInvoice ? "Generating..." : "Generate GST Invoice"}
      </Button>
      
      <Button 
        onClick={onRecordPayment}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        Record Payment
      </Button>
      
      <InvoiceDateRangeDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
        onGenerate={handleGenerateInvoice}
        customer={customer}
        isGenerating={isGeneratingInvoice}
      />
    </div>
  );
};

export default TransactionActions;
