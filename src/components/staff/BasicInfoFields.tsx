
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasicInfoFieldsProps {
  staffData: {
    name: string;
    phone: string;
    email: string;
    role: string;
    salary: string | number;
    joining_date: string;
    password: string;
  };
  errors: Record<string, string>;
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
}

export function BasicInfoFields({ staffData, errors, isEditing, onChange }: BasicInfoFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={staffData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Enter staff name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={staffData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="Enter 10-digit phone number"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={staffData.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="Enter email address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={staffData.role}
            onValueChange={(value) => onChange('role', value)}
          >
            <SelectTrigger id="role" className={errors.role ? "border-red-500" : ""}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pump Operator">Pump Operator</SelectItem>
              <SelectItem value="Cashier">Cashier</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Accountant">Accountant</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Monthly Salary (₹)</Label>
          <Input
            id="salary"
            type="number"
            value={staffData.salary}
            onChange={(e) => onChange('salary', e.target.value)}
            placeholder="Enter monthly salary"
            className={errors.salary ? "border-red-500" : ""}
          />
          {errors.salary && <p className="text-sm text-red-500">{errors.salary}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="joining_date">Joining Date</Label>
          <Input
            id="joining_date"
            type="date"
            value={staffData.joining_date}
            onChange={(e) => onChange('joining_date', e.target.value)}
          />
        </div>
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={staffData.password}
            onChange={(e) => onChange('password', e.target.value)}
            className={errors.password ? "border-red-500" : ""}
            placeholder="Enter password for staff login"
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>
      )}
    </>
  );
}
