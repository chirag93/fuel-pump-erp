import { useState, useEffect } from 'react';
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

interface StaffPayload {
  id?: any;
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: number;
  joining_date: string;
  assigned_pumps: string[];
  auth_id?: any;
  fuel_pump_id?: string;
  mobile_only_access: boolean;
  features: StaffFeature[];
  password?: string; // Make password optional in the payload
}

// Get the internal token from environment variable if available
const INTERNAL_TOKEN_KEY = import.meta.env.VITE_INTERNAL_TOKEN_KEY || '';

export const useStaffForm = (initialData?: any, onSubmit?: (staff: any) => void, onCancel?: () => void) => {
  
  const [staffData, setStaffData] = useState<StaffFormData>({
    name: '',
    phone: '',
    email: '',
    role: '',
    salary: '',
    joining_date: new Date().toISOString().split('T')[0],
    assigned_pumps: [],
    password: '',
    confirmPassword: '',
  });
  const [selectedFeatures, setSelectedFeatures] = useState<StaffFeature[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPump, setSelectedPump] = useState<string>('');
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [mobileOnlyAccess, setMobileOnlyAccess] = useState<boolean>(false);

  // Initialize form data from initialData when available
  useEffect(() => {
    if (initialData) {
      console.log("Initializing form with data:", initialData.id);
      
      
      // Safely parse assigned_pumps
      let assignedPumps: string[] = [];
      if (initialData.assigned_pumps) {
        try {
          if (typeof initialData.assigned_pumps === 'string') {
            assignedPumps = JSON.parse(initialData.assigned_pumps);
          } else if (Array.isArray(initialData.assigned_pumps)) {
            assignedPumps = initialData.assigned_pumps;
          }
        } catch (e) {
          console.error("Error parsing assigned_pumps:", e);
          assignedPumps = [];
        }
      }

      setStaffData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        role: initialData.role || '',
        salary: initialData.salary || '',
        joining_date: initialData.joining_date || new Date().toISOString().split('T')[0],
        assigned_pumps: Array.isArray(assignedPumps) ? assignedPumps : [],
        password: '',
        confirmPassword: '',
      });
      
      setMobileOnlyAccess(Boolean(initialData.mobile_only_access));
      
      if (initialData.features && Array.isArray(initialData.features)) {
        setSelectedFeatures(initialData.features);
      }
    }
  }, [initialData]);

  

  const handleChange = (field: string, value: string) => {
    setStaffData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddPump = () => {
    if (selectedPump && !staffData.assigned_pumps.includes(selectedPump)) {
      setStaffData(prev => ({ 
        ...prev, 
        assigned_pumps: [...prev.assigned_pumps, selectedPump] 
      }));
      setSelectedPump('');
    }
  };

  const handleRemovePump = (pump: string) => {
    setStaffData(prev => ({
      ...prev,
      assigned_pumps: prev.assigned_pumps.filter((p: string) => p !== pump)
    }));
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

  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);

  useEffect(() => {
    const initFuelPumpId = async () => {
      const id = await getFuelPumpId();
      setFuelPumpId(id);
    };
    
    initFuelPumpId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to manage staff",
          variant: "destructive"
        });
        return;
      }

      if (!initialData) {
        // Creating new staff member
        try {
          const payload = {
            name: staffData.name,
            email: staffData.email,
            password: staffData.password,
            staffRole: staffData.role,
            phone: staffData.phone,
            salary: parseFloat(staffData.salary.toString()),
            joining_date: staffData.joining_date,
            fuelPumpId: fuelPumpId,
            mobile_only_access: mobileOnlyAccess,
            assigned_pumps: staffData.assigned_pumps,
            features: selectedFeatures
          };
          
          console.log("Invoking create-staff-user with data:", {
            ...payload,
            password: "***"
          });
          
          // Add security headers for the edge function
          const { data, error } = await supabase.functions.invoke("create-staff-user", {
            body: payload,
            headers: INTERNAL_TOKEN_KEY ? {
              'x-internal-token': INTERNAL_TOKEN_KEY
            } : undefined
          });

          if (error) {
            console.error("Edge function error:", error);
            throw new Error(error.message || "Failed to create staff user");
          }
          
          if (!data?.success) {
            console.error("Staff creation failed:", data?.error);
            let errorMessage = data?.error || "Failed to create staff user";
            
            // Set field-specific errors based on error type
            if (data?.errorType === 'DUPLICATE_PHONE') {
              setErrors(prev => ({
                ...prev,
                phone: "This phone number is already registered with another staff member"
              }));
              throw new Error("This phone number is already registered with another staff member");
            } else if (data?.errorType === 'DUPLICATE_EMAIL') {
              setErrors(prev => ({
                ...prev,
                email: "This email is already registered with another staff member"
              }));
              throw new Error("This email is already registered with another staff member");  
            }
            
            throw new Error(errorMessage);
          }

          console.log("Staff created successfully:", data);
          
          if (data.data && data.data.staff_id && onSubmit) {
            const staffPayload = {
              id: data.data.staff_id,
              auth_id: data.data.auth_id,
              name: staffData.name,
              phone: staffData.phone,
              email: staffData.email,
              role: staffData.role,
              salary: parseFloat(staffData.salary.toString()),
              joining_date: staffData.joining_date,
              assigned_pumps: staffData.assigned_pumps,
              fuel_pump_id: fuelPumpId,
              mobile_only_access: mobileOnlyAccess,
              features: selectedFeatures
            };
            
            await onSubmit(staffPayload);
            
            toast({
              title: "Staff Created",
              description: `${staffData.name} has been added successfully`
            });

            if (onCancel) onCancel();
          }
        } catch (functionError: any) {
          console.error('Error in staff creation:', functionError);
          
          // Show a toast with the error message
          toast({
            title: "Staff Creation Failed",
            description: functionError.message || "Failed to create staff member",
            variant: "destructive"
          });
          
          return;
        }
      } else if (onSubmit) {
        
        // For existing staff, use the regular onSubmit callback
        const staffPayload: StaffPayload = {
          id: initialData.id,
          name: staffData.name,
          phone: staffData.phone,
          email: staffData.email,
          role: staffData.role,
          salary: parseFloat(staffData.salary.toString()),
          joining_date: staffData.joining_date,
          assigned_pumps: staffData.assigned_pumps,
          auth_id: initialData.auth_id,
          fuel_pump_id: fuelPumpId,
          mobile_only_access: mobileOnlyAccess,
          features: selectedFeatures
        };
        
        // Only add password to payload if changing password
        if (changePassword && staffData.password) {
          staffPayload.password = staffData.password;
        }
        
        await onSubmit(staffPayload);
        
        toast({
          title: "Staff Updated",
          description: `${staffData.name} has been updated successfully`
        });

        if (onCancel) onCancel();
      }
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
