
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface BasicInfoFieldsProps {
  staffData: {
    name: string;
    phone: string;
    email: string;
    role: string;
    salary: string | number;
    joining_date: string;
    password: string;
    confirmPassword: string;
  };
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

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="changePassword" 
              checked={changePassword}
              onCheckedChange={(checked) => setChangePassword(checked as boolean)}
            />
            <Label htmlFor="changePassword" className="cursor-pointer">Change password</Label>
          </div>
          
          {changePassword && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={staffData.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                  placeholder="Enter new password"
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={staffData.confirmPassword}
                  onChange={(e) => onChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={staffData.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? "border-red-500" : ""}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>
      )}
    </>
  );
}
