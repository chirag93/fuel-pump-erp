
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import DateRangeSelector from './DateRangeSelector';

interface TransactionActionsProps {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  resetDateRange: () => void;
  onGenerateInvoice: () => void;
  isGeneratingInvoice: boolean;
  onRecordPayment: () => void;
}

const TransactionActions = ({
  dateRange,
  setDateRange,
  resetDateRange,
  onGenerateInvoice,
  isGeneratingInvoice,
  onRecordPayment
}: TransactionActionsProps) => {
  return (
    <div className="flex space-x-2">
      <DateRangeSelector 
        dateRange={dateRange}
        setDateRange={setDateRange}
        resetDateRange={resetDateRange}
      />
      
      <Button 
        onClick={onGenerateInvoice} 
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
    </div>
  );
};

export default TransactionActions;
