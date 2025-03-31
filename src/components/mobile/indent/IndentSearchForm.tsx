
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IndentSearchFormProps {
  searchIndentNumber: string;
  setSearchIndentNumber: (value: string) => void;
  isSearching: boolean;
  searchError: string;
  onSearch: () => void;
  selectedCustomerName: string;
}

export const IndentSearchForm = ({
  searchIndentNumber,
  setSearchIndentNumber,
  isSearching,
  searchError,
  onSearch,
  selectedCustomerName
}: IndentSearchFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="searchIndentNumber" className="text-sm font-medium mb-1 block">
          Search Indent Number
        </Label>
        <div className="flex gap-2">
          <Input
            id="searchIndentNumber"
            value={searchIndentNumber}
            onChange={(e) => setSearchIndentNumber(e.target.value)}
            className="flex-1"
            placeholder="Enter indent number"
          />
          <Button 
            onClick={onSearch} 
            disabled={isSearching}
            size="sm"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
        {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
      </div>
      
      {selectedCustomerName && (
        <div className="mt-2 p-2 bg-slate-100 rounded">
          <p className="font-medium">Customer: {selectedCustomerName}</p>
        </div>
      )}
    </div>
  );
};
