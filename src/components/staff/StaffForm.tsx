
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface StaffFormProps {
  onSubmit: (staff: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const StaffForm = ({ onSubmit, onCancel, initialData }: StaffFormProps) => {
  const [staffData, setStaffData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    role: initialData?.role || '',
    salary: initialData?.salary || '',
    joiningDate: initialData?.joiningDate || new Date().toISOString().split('T')[0],
    assignedPumps: initialData?.assignedPumps || []
  });

  const [selectedPump, setSelectedPump] = useState<string>('');

  const handleChange = (field: string, value: string) => {
    setStaffData({ ...staffData, [field]: value });
  };

  const handleAddPump = () => {
    if (selectedPump && !staffData.assignedPumps.includes(selectedPump)) {
      setStaffData({ 
        ...staffData, 
        assignedPumps: [...staffData.assignedPumps, selectedPump] 
      });
      setSelectedPump('');
    }
  };

  const handleRemovePump = (pump: string) => {
    setStaffData({
      ...staffData,
      assignedPumps: staffData.assignedPumps.filter((p: string) => p !== pump)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!staffData.name || !staffData.phone || !staffData.role || !staffData.salary) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Submit the form
    onSubmit(staffData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={staffData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter staff name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={staffData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={staffData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter email address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={staffData.role}
            onValueChange={(value) => handleChange('role', value)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pump Operator">Pump Operator</SelectItem>
              <SelectItem value="Cashier">Cashier</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Accountant">Accountant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Monthly Salary (₹)</Label>
          <Input
            id="salary"
            type="number"
            value={staffData.salary}
            onChange={(e) => handleChange('salary', e.target.value)}
            placeholder="Enter monthly salary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="joiningDate">Joining Date</Label>
          <Input
            id="joiningDate"
            type="date"
            value={staffData.joiningDate}
            onChange={(e) => handleChange('joiningDate', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Assigned Pumps</Label>
        <div className="flex gap-2">
          <Select value={selectedPump} onValueChange={setSelectedPump}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select pump" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pump-1">Pump 1 - Petrol</SelectItem>
              <SelectItem value="Pump-2">Pump 2 - Diesel</SelectItem>
              <SelectItem value="Pump-3">Pump 3 - Premium Petrol</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={handleAddPump}>Add</Button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {staffData.assignedPumps.map((pump: string) => (
            <div key={pump} className="bg-muted px-3 py-1 rounded-full flex items-center gap-1">
              <span>{pump}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 rounded-full"
                onClick={() => handleRemovePump(pump)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Staff</Button>
      </div>
    </form>
  );
};

export default StaffForm;
