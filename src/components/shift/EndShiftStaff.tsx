
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EndShiftStaffProps {
  createNewShift: boolean;
  setCreateNewShift: (checked: boolean) => void;
  selectedStaff: string;
  setSelectedStaff: (value: string) => void;
  staff: any[];
}

export function EndShiftStaff({
  createNewShift,
  setCreateNewShift,
  selectedStaff,
  setSelectedStaff,
  staff
}: EndShiftStaffProps) {
  return (
    <>
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="createNewShift" 
          checked={createNewShift} 
          onCheckedChange={(checked) => {
            setCreateNewShift(checked === true);
          }}
        />
        <Label htmlFor="createNewShift" className="cursor-pointer">
          Create new shift for this pump
        </Label>
      </div>
      
      {createNewShift && (
        <div className="grid gap-2">
          <Label htmlFor="newStaff">Assign Staff for Next Shift</Label>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger id="newStaff">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} (ID: {s.id.substring(0, 8)}) - {s.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
