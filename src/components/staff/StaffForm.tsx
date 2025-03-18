import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeatureSelection } from './FeatureSelection';

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
    joining_date: initialData?.joining_date || new Date().toISOString().split('T')[0],
    assigned_pumps: initialData?.assigned_pumps || [],
    password: '', // New field for password
  });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPump, setSelectedPump] = useState<string>('');

  const handleChange = (field: string, value: string) => {
    setStaffData({ ...staffData, [field]: value });
    // Clear error when field is edited
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleAddPump = () => {
    if (selectedPump && !staffData.assigned_pumps.includes(selectedPump)) {
      setStaffData({ 
        ...staffData, 
        assigned_pumps: [...staffData.assigned_pumps, selectedPump] 
      });
      setSelectedPump('');
    }
  };

  const handleRemovePump = (pump: string) => {
    setStaffData({
      ...staffData,
      assigned_pumps: staffData.assigned_pumps.filter((p: string) => p !== pump)
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!staffData.name.trim()) newErrors.name = "Name is required";
    
    // Phone validation
    if (!staffData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(staffData.phone.trim())) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    
    if (!staffData.role) newErrors.role = "Role is required";
    if (!staffData.salary) newErrors.salary = "Salary is required";
    if (!initialData && !staffData.password) newErrors.password = "Password is required for new staff";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      let authId;
      
      // Create auth user if this is a new staff member
      if (!initialData) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffData.email,
          password: staffData.password,
          options: {
            data: {
              name: staffData.name,
              role: staffData.role
            }
          }
        });

        if (authError) throw authError;
        authId = authData.user?.id;
      }

      // Process and submit staff data
      const staffPayload = {
        ...staffData,
        auth_id: authId,
        salary: parseFloat(staffData.salary.toString())
      };

      // Remove password from payload as it's handled by auth
      delete staffPayload.password;

      // Submit to parent handler
      await onSubmit(staffPayload);

      // If this is a new staff member, set their permissions
      if (!initialData && authId) {
        const staffRecord = await supabase
          .from('staff')
          .select('id')
          .eq('auth_id', authId)
          .single();

        if (staffRecord.error) throw staffRecord.error;

        // Insert permissions
        const { error: permError } = await supabase
          .from('staff_permissions')
          .insert(
            selectedFeatures.map(feature => ({
              staff_id: staffRecord.data.id,
              feature: feature
            }))
          );

        if (permError) throw permError;
      }

      toast({
        title: initialData ? "Staff Updated" : "Staff Created",
        description: `${staffData.name} has been ${initialData ? 'updated' : 'added'} successfully.`
      });

    } catch (error) {
      console.error('Error saving staff:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff data",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={staffData.name}
            onChange={(e) => handleChange('name', e.target.value)}
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
            onChange={(e) => handleChange('phone', e.target.value)}
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
            onChange={(e) => handleChange('salary', e.target.value)}
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
            onChange={(e) => handleChange('joining_date', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Assigned Pumps</Label>
        <div className="flex flex-col sm:flex-row gap-2">
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
          {staffData.assigned_pumps.map((pump: string) => (
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

      {!initialData && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={staffData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={errors.password ? "border-red-500" : ""}
            placeholder="Enter password for staff login"
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>
      )}

      <FeatureSelection
        staffId={initialData?.id}
        onFeaturesChange={setSelectedFeatures}
        initialFeatures={[]}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="mr-2">Saving...</span>
              <span className="animate-spin">⌛</span>
            </>
          ) : (
            'Save Staff'
          )}
        </Button>
      </div>
    </form>
  );
};

export default StaffForm;
