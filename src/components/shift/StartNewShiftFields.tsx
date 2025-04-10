
import { NewShiftData, StaffMember } from '@/hooks/useEndShiftDialogLogic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StartNewShiftFieldsProps {
  newShiftData: NewShiftData;
  staffList: StaffMember[];
  handleNewShiftInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStaffChange: (value: string) => void;
}

export function StartNewShiftFields({
  newShiftData,
  staffList,
  handleNewShiftInputChange,
  handleStaffChange
}: StartNewShiftFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="staff_id">Select Staff for Next Shift</Label>
        <Select 
          value={newShiftData.staff_id}
          onValueChange={handleStaffChange}
        >
          <SelectTrigger id="staff_id">
            <SelectValue placeholder="Select staff member" />
          </SelectTrigger>
          <SelectContent>
            {staffList.map(staff => (
              <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="cash_given">New Cash Given</Label>
        <Input
          id="cash_given"
          name="cash_given"
          type="number"
          value={newShiftData.cash_given === 0 ? '' : newShiftData.cash_given}
          onChange={handleNewShiftInputChange}
        />
      </div>
    </div>
  );
}
