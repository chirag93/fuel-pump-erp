import { Dispatch, SetStateAction } from 'react';
import { Shift, Staff } from '@/types/shift';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { ConsumableSelection } from './ConsumableSelection';
import { useState } from 'react';

interface StartShiftFormProps {
  formOpen: boolean;
  setFormOpen: Dispatch<SetStateAction<boolean>>;
  newShift: Partial<Shift>;
  setNewShift: Dispatch<SetStateAction<Partial<Shift>>>;
  handleAddShift: () => Promise<boolean>;
  staffList: Staff[];
}

export interface SelectedConsumable {
  id: string;
  name: string;
  quantity: number;
  available: number;
  price_per_unit: number;
  unit: string;
}

export function StartShiftForm({ 
  formOpen, 
  setFormOpen, 
  newShift, 
  setNewShift, 
  handleAddShift,
  staffList 
}: StartShiftFormProps) {
  const [selectedConsumables, setSelectedConsumables] = useState<SelectedConsumable[]>([]);
  
  const onSubmit = async () => {
    const success = await handleAddShift();
    if (success) {
      setFormOpen(false);
      setSelectedConsumables([]);
    }
  };

  return (
    <Dialog open={formOpen} onOpenChange={(open) => {
      setFormOpen(open);
      if (!open) setSelectedConsumables([]);
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Start New Shift
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Shift</DialogTitle>
          <DialogDescription>
            Enter the details to start a new shift.
          </DialogDescription>
        </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="staffId">Staff</Label>
          <Select 
            value={newShift.staff_id}
            onValueChange={(value) => setNewShift({...newShift, staff_id: value})}
          >
            <SelectTrigger id="staffId">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pumpId">Pump</Label>
          <Select 
            value={newShift.pump_id}
            onValueChange={(value) => setNewShift({...newShift, pump_id: value})}
          >
            <SelectTrigger id="pumpId">
              <SelectValue placeholder="Select pump" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P001">Pump 1 - Petrol</SelectItem>
              <SelectItem value="P002">Pump 2 - Diesel</SelectItem>
              <SelectItem value="P003">Pump 3 - Petrol Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={newShift.date}
            onChange={(e) => setNewShift({...newShift, date: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="openingReading">Opening Reading</Label>
            <Input
              id="openingReading"
              type="number"
              value={newShift.opening_reading?.toString()}
              onChange={(e) => setNewShift({...newShift, opening_reading: parseFloat(e.target.value)})}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cashGiven">Starting Cash Balance</Label>
          <Input
            id="cashGiven"
            type="number"
            value={newShift.starting_cash_balance?.toString()}
            onChange={(e) => setNewShift({...newShift, starting_cash_balance: parseFloat(e.target.value)})}
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <ConsumableSelection
            selectedConsumables={selectedConsumables}
            setSelectedConsumables={setSelectedConsumables}
            mode="allocate"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
        <Button onClick={onSubmit}>Start Shift</Button>
      </DialogFooter>
    </DialogContent>
  );
}
