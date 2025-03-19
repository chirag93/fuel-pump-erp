
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface StaffFormData {
  name: string;
  phone: string;
  email?: string;
  role: string;
  salary: string | number;
  joining_date: string;
  password: string;
  confirmPassword: string;
}

interface BasicInfoFieldsProps {
  staffData: StaffFormData;
  errors: Record<string, string>;
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  changePassword: boolean;
  setChangePassword: (value: boolean) => void;
}

export function BasicInfoFields({ 
  staffData, 
  errors, 
  isEditing, 
  onChange, 
  changePassword, 
  setChangePassword 
}: BasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name*</Label>
        <Input
          id="name"
          value={staffData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number*</Label>
          <Input
            id="phone"
            value={staffData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="text"
            value={staffData.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="Optional - Leave blank to auto-generate"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role*</Label>
          <Select 
            value={staffData.role} 
            onValueChange={(value) => onChange('role', value)}
          >
            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Station Manager">Station Manager</SelectItem>
              <SelectItem value="Shift Manager">Shift Manager</SelectItem>
              <SelectItem value="Pump Attendant">Pump Attendant</SelectItem>
              <SelectItem value="Accountant">Accountant</SelectItem>
              <SelectItem value="Cleaner">Cleaner</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
              <SelectItem value="Driver">Driver</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">Monthly Salary (₹)*</Label>
          <Input
            id="salary"
            type="number"
            value={staffData.salary}
            onChange={(e) => onChange('salary', e.target.value)}
            className={errors.salary ? 'border-red-500' : ''}
          />
          {errors.salary && <p className="text-sm text-red-500">{errors.salary}</p>}
        </div>
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

      {isEditing ? (
        <div className="space-y-2 pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={changePassword}
              onCheckedChange={setChangePassword}
              id="change-password"
            />
            <Label htmlFor="change-password">Change Password</Label>
          </div>
        </div>
      ) : null}

      {(!isEditing || changePassword) && (
        <>
          <div className="space-y-2">
            <Label htmlFor="password">Password{isEditing ? '' : '*'}</Label>
            <Input
              id="password"
              type="password"
              value={staffData.password}
              onChange={(e) => onChange('password', e.target.value)}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password{isEditing ? '' : '*'}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={staffData.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
        </>
      )}
    </div>
  );
}
