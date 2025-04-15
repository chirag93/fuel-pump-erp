import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { getFuelPumpId } from '@/integrations/utils';

type StaffFeature = Database['public']['Enums']['staff_feature'];

interface StaffFormData {
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: string | number;
  joining_date: string;
  assigned_pumps: string[];
  password: string;
  confirmPassword: string;
}

export const useStaffForm = (initialData?: any, onSubmit?: (staff: any) => void, onCancel?: () => void) => {
  const [staffData, setStaffData] = useState<StaffFormData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    role: initialData?.role || '',
    salary: initialData?.salary || '',
    joining_date: initialData?.joining_date || new Date().toISOString().split('T')[0],
    assigned_pumps: initialData?.assigned_pumps || [],
    password: '',
    confirmPassword: '',
  });
  const [selectedFeatures, setSelectedFeatures] = useState<StaffFeature[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPump, setSelectedPump] = useState<string>('');
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [mobileOnlyAccess, setMobileOnlyAccess] = useState<boolean>(initialData?.mobile_only_access || false);

  const handleChange = (field: string, value: string) => {
    setStaffData({ ...staffData, [field]: value });
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
    
    if (!staffData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(staffData.phone.trim())) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    
    if (!staffData.email || !staffData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(staffData.email.trim())) {
      newErrors.email = "Please enter a valid email format";
    }
    
    if (!staffData.role) newErrors.role = "Role is required";
    if (!staffData.salary) newErrors.salary = "Salary is required";
    
    // Password validation
    if (!initialData && !staffData.password) {
      newErrors.password = "Password is required for new staff";
    } else if (changePassword && !staffData.password) {
      newErrors.password = "Password is required when changing password";
    }
    
    // Confirm password validation
    if ((changePassword || !initialData) && staffData.password) {
      if (!staffData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm the password";
      } else if (staffData.password !== staffData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get fuel pump ID first
      const fuelPumpId = await getFuelPumpId();
      if (!fuelPumpId) {
        toast({
          title: "Error",
          description: "Could not determine fuel pump ID",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log("Creating staff with data:", {
        ...staffData,
        mobile_only_access: mobileOnlyAccess,
        fuelPumpId
      });

      if (!initialData) {
        // Creating new staff member
        const response = await supabase.functions.invoke("create-staff-user", {
          body: {
            email: staffData.email,
            password: staffData.password,
            name: staffData.name,
            staffRole: staffData.role,
            phone: staffData.phone,
            salary: parseFloat(staffData.salary.toString()),
            joining_date: staffData.joining_date,
            fuelPumpId: fuelPumpId,
            mobile_only_access: mobileOnlyAccess
          }
        });

        if (response.error || !response.data?.success) {
          throw new Error(response.error?.message || response.data?.error || "Failed to create staff user");
        }

        console.log("Staff created successfully:", response.data);
      }

      const staffPayload = {
        name: staffData.name,
        phone: staffData.phone,
        email: staffData.email,
        role: staffData.role,
        salary: parseFloat(staffData.salary.toString()),
        joining_date: staffData.joining_date,
        assigned_pumps: staffData.assigned_pumps,
        fuel_pump_id: fuelPumpId,
        mobile_only_access: mobileOnlyAccess
      };

      if (onSubmit) {
        await onSubmit(staffPayload);
      }

      toast({
        title: initialData ? "Staff Updated" : "Staff Created",
        description: `${staffData.name} has been ${initialData ? 'updated' : 'added'} successfully`
      });

      if (onCancel) onCancel();
    } catch (error: any) {
      console.error('Error in staff form submission:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    staffData,
    selectedFeatures,
    errors,
    isSubmitting,
    selectedPump,
    changePassword,
    mobileOnlyAccess,
    handleChange,
    handleAddPump,
    handleRemovePump,
    handleSubmit,
    setSelectedFeatures,
    setSelectedPump,
    setChangePassword,
    setMobileOnlyAccess
  };
};
