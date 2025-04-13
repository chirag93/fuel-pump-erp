
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
        // Use the provided email directly since it's now required
        const validEmail = staffData.email;
          
        console.log("Creating staff with email:", validEmail);
        
        try {
          // When creating a new staff member, use signUp with options that bypass email verification
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: validEmail,
            password: staffData.password,
            options: {
              data: {
                name: staffData.name,
                role: 'staff',
                fuelPumpId: fuelPumpId,
                mobile_only_access: mobileOnlyAccess
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
          
          // Immediately update the user metadata to include fuel pump ID
          if (authId) {
            // Get fuel pump name
            const { data: pumpData } = await supabase
              .from('fuel_pumps')
              .select('name')
              .eq('id', fuelPumpId)
              .single();
            
            // CRITICAL CHANGE: Use an admin function that won't affect current user's session
            // This was causing the current admin user to get logged out
            try {
              // Try to use admin.updateUserById instead of updateUser to avoid affecting current session
              await supabase.auth.admin.updateUserById(authId, {
                user_metadata: { 
                  fuelPumpId: fuelPumpId,
                  fuelPumpName: pumpData?.name,
                  role: 'staff',
                  mobile_only_access: mobileOnlyAccess
                }
              });
              
              console.log(`Updated auth user metadata with fuelPumpId: ${fuelPumpId} and mobile_only_access: ${mobileOnlyAccess}`);
            } catch (updateError) {
              console.error("Error using admin.updateUserById, falling back to alternative method:", updateError);
              
              // If admin function fails, we'll create a staff record anyway
              // The metadata will be updated when the user logs in next time
              console.log("Created user but couldn't update metadata - this is non-critical");
              toast({
                title: "Staff Created",
                description: "Staff user was created but some profile settings may need to be configured on first login.",
              });
            }
          }
        } catch (authCreateError) {
          console.error("Error creating auth user:", authCreateError);
          toast({
            title: "Error Creating Staff",
            description: "Could not create staff login account. Please check the provided email and try again.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      } else if (changePassword && staffData.password) {
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

      // Update the user metadata to include mobile_only_access if this is an edit
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
