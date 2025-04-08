
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Staff } from '@/types/shift';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EndShiftStaffProps {
  createNewShift: boolean;
  setCreateNewShift: (checked: boolean) => void;
  selectedStaff: string;
  setSelectedStaff: (value: string) => void;
  staff: Staff[];
  validation?: {
    error: boolean;
    message?: string;
  };
}

export function EndShiftStaff({
  createNewShift,
  setCreateNewShift,
  selectedStaff,
  setSelectedStaff,
  staff,
  validation
}: EndShiftStaffProps) {
  const availableStaff = staff.filter(s => s.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="createNewShift" 
          checked={createNewShift} 
          onCheckedChange={(checked) => {
            setCreateNewShift(checked === true);
          }}
        />
        <Label htmlFor="createNewShift" className="cursor-pointer font-medium">
          Create new shift for this pump
        </Label>
      </div>
      
      {createNewShift && (
        <div className="space-y-3 border-l-2 border-primary/20 pl-4 mt-2">
          <Label htmlFor="newStaff" className="text-sm font-semibold block">
            Assign Staff for Next Shift
          </Label>
          
          {availableStaff.length === 0 ? (
            <Alert variant="default" className="mt-2 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No staff members available for assignment</AlertDescription>
            </Alert>
          ) : (
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger id="newStaff">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.staff_numeric_id ? `(ID: ${s.staff_numeric_id})` : ''} - {s.role || 'Staff'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {validation && validation.error && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validation.message || 'Please select a staff member'}</AlertDescription>
            </Alert>
          )}
          
          <p className="text-xs text-muted-foreground mt-1">
            The selected staff will start a new shift immediately after the current shift ends.
          </p>
        </div>
      )}
    </div>
  );
}
