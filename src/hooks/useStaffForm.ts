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
    
    // Email validation - now required
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
      // Get fuel pump ID first to ensure we have it for the staff record
      const fuelPumpId = await getFuelPumpId();
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to manage staff",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      let authId;
      
      if (!initialData) {
        // Creating a new staff member
        try {
          console.log("Creating new staff member with email:", staffData.email);
          
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

          if (response.error) {
            console.error("Edge function error:", response.error);
            throw new Error(response.error.message || "Failed to create staff user");
          }

          const responseData = response.data;
          
          if (!responseData || !responseData.success) {
            const errorMessage = responseData?.error || "Failed to create staff user account";
            console.error("Staff creation failed:", errorMessage);
            throw new Error(errorMessage);
          }
          
          console.log("Staff created successfully:", responseData);
          
          if (onSubmit) {
            await onSubmit(staffData);
          }

          toast({
            title: "Staff Added",
            description: `${staffData.name} has been added successfully`
          });

          if (onCancel) onCancel();
        } catch (error: any) {
          console.error('Error creating staff:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to create staff member",
            variant: "destructive"
          });
        }
      } else {
        // For existing staff, use our custom edge function to update the password
        if (!initialData.auth_id) {
          toast({
            title: "Cannot Change Password",
            description: "This staff member doesn't have an associated user account",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        // Get the current session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please log in to change staff passwords",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        console.log("Calling edge function to update password");
        const { data, error } = await supabase.functions.invoke("admin-reset-staff-password", {
          body: {
            staff_id: initialData.id,
            auth_id: initialData.auth_id,
            new_password: staffData.password
          }
        });

        if (error) {
          console.error("Error calling password reset function:", error);
          toast({
            title: "Password Update Failed",
            description: error.message || "Could not connect to password reset service",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        if (!data?.success) {
          console.error("Error updating password:", data?.error);
          toast({
            title: "Password Update Failed",
            description: data?.error || "Failed to update password. Please try again.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        console.log("Password updated successfully via edge function");
        toast({
          title: "Password Updated",
          description: "The staff member's password has been updated successfully"
        });
        
        // If we have metadata from the edge function response, update the auth user
        if (data.metadata) {
          try {
            // Get the current user session to get user info
            const { data: getCurrentUser } = await supabase.auth.getUser();
            
            // Only do this if the current user is not the staff member being updated
            if (getCurrentUser?.user?.id !== initialData.auth_id) {
              console.log("Staff's metadata preserved in edge function response");
            }
          } catch (metadataError) {
            console.error("Error verifying metadata:", metadataError);
          }
        }
      }

      // Update mobile_only_access for existing staff
      if (initialData?.auth_id) {
        try {
          // CRITICAL CHANGE: Use admin function to update existing staff user metadata
          await supabase.auth.admin.updateUserById(initialData.auth_id, {
            user_metadata: { mobile_only_access: mobileOnlyAccess }
          });
          console.log(`Updated auth user metadata for existing staff with mobile_only_access: ${mobileOnlyAccess}`);
        } catch (metadataError) {
          console.error("Failed to update mobile_only_access in user metadata:", metadataError);
          // Continue with the rest of the staff update
        }
      }

      const staffPayload = {
        name: staffData.name,
        phone: staffData.phone,
        email: staffData.email,
        role: staffData.role,
        salary: parseFloat(staffData.salary.toString()),
        joining_date: staffData.joining_date,
        assigned_pumps: staffData.assigned_pumps,
        auth_id: authId || initialData?.auth_id,
        fuel_pump_id: fuelPumpId,
        is_active: true,
        mobile_only_access: mobileOnlyAccess
      };

      console.log("Submitting staff data via API:", { ...staffPayload, auth_id: staffPayload.auth_id ? "[redacted]" : undefined });
      
      if (onSubmit) {
        // Let the parent component handle the API call
        await onSubmit(staffPayload);
      } else {
        // Direct database insert if no onSubmit callback
        if (initialData) {
          const { error } = await supabase
            .from('staff')
            .update(staffPayload)
            .eq('id', initialData.id)
            .eq('fuel_pump_id', fuelPumpId);
            
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
      console.error("Unhandled error in create-staff-user function:", error);
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred"
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
