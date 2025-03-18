
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
  });
  const [selectedFeatures, setSelectedFeatures] = useState<StaffFeature[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPump, setSelectedPump] = useState<string>('');

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
    if (!initialData && !staffData.password) newErrors.password = "Password is required for new staff";
    
    // Email validation removed - we no longer validate the email format
    
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
        // When creating a new staff member, use signUpWithPassword instead of signUp
        // This prevents Supabase from sending verification emails
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffData.email,
          password: staffData.password,
          options: {
            data: {
              name: staffData.name,
              role: 'staff' // Use 'staff' role instead of the staffData.role
            },
            emailRedirectTo: window.location.origin,
            // Disable email confirmation requirement
            emailConfirm: false
          }
        });

        if (authError) throw authError;
        authId = authData.user?.id;
      }

      const staffPayload = {
        ...staffData,
        auth_id: authId,
        salary: parseFloat(staffData.salary.toString())
      };

      delete staffPayload.password;

      await onSubmit?.(staffPayload);

      if (!initialData && authId) {
        // After creating the staff record, add permissions
        // Use maybeSingle() instead of single() to handle cases where no rows are returned
        const staffRecord = await supabase
          .from('staff')
          .select('id')
          .eq('auth_id', authId)
          .maybeSingle();

        if (staffRecord.error) throw staffRecord.error;
        
        // Only proceed if a staff record was found
        if (staffRecord.data) {
          if (selectedFeatures.length > 0) {
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
        } else {
          console.log('No staff record found for auth_id:', authId);
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
    handleChange,
    handleAddPump,
    handleRemovePump,
    handleSubmit,
    setSelectedFeatures,
    setSelectedPump
  };
};
