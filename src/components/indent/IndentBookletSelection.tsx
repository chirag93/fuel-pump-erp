
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { IndentBooklet } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface IndentBookletSelectionProps {
  selectedCustomer: string;
  selectedBooklet: string;
  setSelectedBooklet: (bookletId: string) => void;
  indentNumber: string;
  setIndentNumber: (indentNumber: string) => void;
  indentNumberError: string;
  setIndentNumberError: (error: string) => void;
}

export const IndentBookletSelection = ({
  selectedCustomer,
  selectedBooklet,
  setSelectedBooklet,
  indentNumber,
  setIndentNumber,
  indentNumberError,
  setIndentNumberError
}: IndentBookletSelectionProps) => {
  const [indentBooklets, setIndentBooklets] = useState<IndentBooklet[]>([]);
  const [isBookletLoading, setIsBookletLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedCustomer) {
      fetchIndentBooklets(selectedCustomer);
    } else {
      setIndentBooklets([]);
    }
  }, [selectedCustomer]);

  const fetchIndentBooklets = async (customerId: string) => {
    setIsBookletLoading(true);
    try {
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'Active')
        .order('issued_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Transform the data to ensure status is one of the allowed types
        const typedBooklets: IndentBooklet[] = data.map(booklet => ({
          ...booklet,
          status: booklet.status as 'Active' | 'Completed' | 'Cancelled'
        }));
        setIndentBooklets(typedBooklets);
      }
    } catch (error) {
      console.error('Error fetching indent booklets:', error);
      toast({
        title: "Error",
        description: "Failed to load indent booklets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBookletLoading(false);
    }
  };

  const validateIndentNumber = (bookletId: string, indentNum: string) => {
    if (!bookletId || !indentNum) {
      setIndentNumberError('');
      return false;
    }

    const selectedBookletData = indentBooklets.find(booklet => booklet.id === bookletId);
    
    if (!selectedBookletData) {
      setIndentNumberError('Selected booklet not found');
      return false;
    }

    const startNum = parseInt(selectedBookletData.start_number);
    const endNum = parseInt(selectedBookletData.end_number);
    const currentNum = parseInt(indentNum);

    if (isNaN(currentNum)) {
      setIndentNumberError('Please enter a valid number');
      return false;
    }

    if (currentNum < startNum || currentNum > endNum) {
      setIndentNumberError(`Indent number must be between ${startNum} and ${endNum}`);
      return false;
    }

    // Check if this indent number has already been used
    supabase
      .from('indents')
      .select('id')
      .eq('indent_number', indentNum)
      .eq('booklet_id', bookletId)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error checking indent number:', error);
          return;
        }

        if (data && data.length > 0) {
          setIndentNumberError('This indent number has already been used');
          return false;
        } else {
          setIndentNumberError('');
          return true;
        }
      });

    // Initial validation passed
    setIndentNumberError('');
    return true;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="booklet">Indent Booklet (Optional)</Label>
        <Select value={selectedBooklet} onValueChange={setSelectedBooklet}>
          <SelectTrigger id="booklet">
            <SelectValue placeholder="Select a booklet" />
          </SelectTrigger>
          <SelectContent>
            {isBookletLoading ? (
              <SelectItem value="loading" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </SelectItem>
            ) : indentBooklets.length === 0 ? (
              <SelectItem value="no-booklets" disabled>
                No active booklets found
              </SelectItem>
            ) : (
              indentBooklets.map((booklet) => (
                <SelectItem key={booklet.id} value={booklet.id}>
                  {booklet.start_number} - {booklet.end_number} (Used: {booklet.used_indents}/{booklet.total_indents})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="indentNumber">Indent Number</Label>
        <Input
          id="indentNumber"
          value={indentNumber}
          onChange={(e) => {
            setIndentNumber(e.target.value);
            if (selectedBooklet) validateIndentNumber(selectedBooklet, e.target.value);
          }}
          placeholder={selectedBooklet ? "Enter indent number" : "Select a booklet first"}
          disabled={!selectedBooklet}
          className={indentNumberError ? "border-red-500" : ""}
        />
        {indentNumberError && (
          <p className="text-red-500 text-sm mt-1">{indentNumberError}</p>
        )}
      </div>
    </div>
  );
};
