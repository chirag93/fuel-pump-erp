
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

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
      let authId;
      
      if (!initialData) {
        // When creating a new staff member, use signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffData.email,
          password: staffData.password,
          options: {
            data: {
              name: staffData.name,
              role: 'staff'
            },
            emailRedirectTo: window.location.origin,
          }
        });

        if (authError) throw authError;
        authId = authData.user?.id;
      } else if (changePassword && staffData.password) {
        // For existing staff, we can't change their password through the admin API with the anon key
        toast({
          title: "Password Change Not Supported",
          description: "Changing staff passwords requires admin privileges. Please log in as the staff member to change their password or use Supabase dashboard.",
          variant: "destructive"
        });
      }

      const staffPayload = {
        ...staffData,
        auth_id: authId || initialData?.auth_id,
        salary: parseFloat(staffData.salary.toString())
      };

      // Remove password fields from database payload
      delete staffPayload.password;
      delete staffPayload.confirmPassword;

      // Call the onSubmit callback with the staff data
      await onSubmit?.(staffPayload);

      if (!initialData && authId) {
        // After creating the staff record, add permissions
        const staffRecord = await supabase
          .from('staff')
          .select('id')
          .eq('auth_id', authId)
          .maybeSingle();

        if (staffRecord.error) throw staffRecord.error;
        
        if (staffRecord.data && selectedFeatures.length > 0) {
          const { error: permError } = await supabase
            .from('staff_permissions')
            .insert(
              selectedFeatures.map(feature => ({
                staff_id: staffRecord.data.id,
                feature
              }))
            );

          if (permError) throw permError;
        }
      } else if (initialData && initialData.id) {
        // For existing staff, update permissions
        // First delete all existing permissions
        const { error: deleteError } = await supabase
          .from('staff_permissions')
          .delete()
          .eq('staff_id', initialData.id);
          
        if (deleteError) throw deleteError;
        
        // Then insert the new permissions
        if (selectedFeatures.length > 0) {
          const { error: permError } = await supabase
            .from('staff_permissions')
            .insert(
              selectedFeatures.map(feature => ({
                staff_id: initialData.id,
                feature
              }))
            );

          if (permError) throw permError;
        }
      }

      toast({
        title: initialData ? "Staff Updated" : "Staff Created",
        description: `${staffData.name} has been ${initialData ? 'updated' : 'added'} successfully.`
      });

    } catch (error: any) {
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

  return {
    staffData,
    selectedFeatures,
    errors,
    isSubmitting,
    selectedPump,
    changePassword,
    handleChange,
    handleAddPump,
    handleRemovePump,
    handleSubmit,
    setSelectedFeatures,
    setSelectedPump,
    setChangePassword
  };
};
