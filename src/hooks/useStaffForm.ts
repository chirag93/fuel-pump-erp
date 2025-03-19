
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
    
    // Email validation - allow for more flexible email formats
    if (staffData.email && staffData.email.trim()) {
      // Basic email format validation
      if (!/\S+@\S+\.\S+/.test(staffData.email.trim())) {
        newErrors.email = "Please enter a valid email format";
      }
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
        // Log the email being used for signup to help debug
        console.log("Creating staff with email:", staffData.email);
        
        // When creating a new staff member, use signUp with signupOptions that bypass email verification
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffData.email || `staff_${Date.now()}@example.com`, // Fallback email if none provided
          password: staffData.password,
          options: {
            data: {
              name: staffData.name,
              role: 'staff'
            },
            // Critical: Disable email verification entirely
            emailRedirectTo: null
          }
        });

        if (authError) {
          console.error("Auth error during staff creation:", authError);
          throw new Error(`Authentication error: ${authError.message}`);
        }
        
        authId = authData.user?.id;
        
        console.log("New staff auth account created:", authId);
      } else if (changePassword && staffData.password) {
        // For existing staff, we can't change their password through the admin API with the anon key
        toast({
          title: "Password Change Not Supported",
          description: "Changing staff passwords requires admin privileges. Please log in as the staff member to change their password.",
          variant: "destructive"
        });
      }

      const staffPayload = {
        name: staffData.name,
        phone: staffData.phone,
        email: staffData.email || `staff_${Date.now()}@example.com`, // Fallback email if none provided
        role: staffData.role,
        salary: parseFloat(staffData.salary.toString()),
        joining_date: staffData.joining_date,
        assigned_pumps: staffData.assigned_pumps,
        auth_id: authId,
        is_active: true
      };

      console.log("Submitting staff data via API:", { ...staffPayload, auth_id: authId ? "[redacted]" : undefined });
      
      if (onSubmit) {
        // Let the parent component handle the API call
        await onSubmit(staffPayload);
      } else {
        // Direct database insert if no onSubmit callback
        if (initialData) {
          const { error } = await supabase
            .from('staff')
            .update(staffPayload)
            .eq('id', initialData.id);
            
          if (error) throw error;
          
          console.log("Updated staff via API:", initialData.id);
        } else {
          const { data, error } = await supabase
            .from('staff')
            .insert([staffPayload])
            .select('id')
            .single();
            
          if (error) throw error;
          
          console.log("Created new staff via API:", data?.id);
          
          // Add permissions if new staff was created
          if (data?.id && selectedFeatures.length > 0) {
            const staffId = data.id;
            const permissionsPayload = selectedFeatures.map(feature => ({
              staff_id: staffId,
              feature
            }));
            
            console.log("Adding staff permissions via API:", permissionsPayload);
            
            const { error: permError } = await supabase
              .from('staff_permissions')
              .insert(permissionsPayload);

            if (permError) throw permError;
          }
        }
      }

      toast({
        title: initialData ? "Staff Updated" : "Staff Created",
        description: `${staffData.name} has been ${initialData ? 'updated' : 'added'} successfully.`
      });

      // Close the form on success
      if (onCancel) onCancel();
      
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
