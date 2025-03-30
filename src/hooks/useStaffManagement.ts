
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { getFuelPumpId } from '@/integrations/utils';
import { Json } from '@/integrations/supabase/types';

// Staff interface reflecting the Supabase schema
export interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: number;
  joining_date: string;
  assigned_pumps: string[];
  features?: string[];
  fuel_pump_id?: string;
  auth_id?: string;
}

export const useStaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  
  // Helper function to safely convert Json to string array
  const convertJsonToStringArray = (jsonValue: Json | null): string[] => {
    if (!jsonValue) return [];
    
    // If it's already an array, map each item to string
    if (Array.isArray(jsonValue)) {
      return jsonValue.map(item => String(item));
    }
    
    // If it's a JSON string, parse it
    if (typeof jsonValue === 'string') {
      try {
        const parsed = JSON.parse(jsonValue);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item));
        }
      } catch (e) {
        console.error('Error parsing JSON array:', e);
      }
    }
    
    return [];
  };

  useEffect(() => {
    const initFuelPumpId = async () => {
      const id = await getFuelPumpId();
      setFuelPumpId(id);
      if (id) {
        fetchStaff(id);
      } else {
        console.log('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view staff",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    initFuelPumpId();
  }, []);
  
  // Fetch staff data from Supabase
  const fetchStaff = useCallback(async (pumpId: string) => {
    setIsLoading(true);
    try {
      console.log("Fetching staff data for fuel pump ID:", pumpId);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('fuel_pump_id', pumpId);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log("Staff data fetched:", data.length, "records");
        // Convert Json to string[] for assigned_pumps
        const formattedData = data.map(item => ({
          ...item,
          assigned_pumps: Array.isArray(item.assigned_pumps) 
            ? item.assigned_pumps.map(String)
            : convertJsonToStringArray(item.assigned_pumps)
        }));
        setStaff(formattedData as Staff[]);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveStaff = async (staffData: any) => {
    try {
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to manage staff",
          variant: "destructive"
        });
        return;
      }

      console.log("Saving staff data via API:", staffData);
      
      // Ensure fuel_pump_id is set
      staffData.fuel_pump_id = fuelPumpId;
      
      if (editingStaff) {
        // Check if email has been changed
        const emailChanged = editingStaff.email !== staffData.email;
        
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', editingStaff.id)
          .eq('fuel_pump_id', fuelPumpId);
        
        if (error) throw error;
        
        toast({ 
          title: "Staff updated", 
          description: `${staffData.name}'s information has been updated` 
        });

        // If there's an auth_id and email has changed, update the user's email in Auth
        if (editingStaff.auth_id && emailChanged) {
          try {
            // First get current user session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              // Check if the current user has admin rights (can update other users)
              // Either we're a super admin, a fuel pump admin, or we're updating our own email
              const canUpdateEmail = session.user.id === editingStaff.auth_id;
              
              if (canUpdateEmail) {
                // Direct update if we're updating our own email
                await supabase.auth.updateUser({ email: staffData.email });
                console.log(`Updated auth email for user ${editingStaff.auth_id} to ${staffData.email}`);
              } else {
                // Try to use the admin-reset-staff-password edge function to update the email
                console.log("Attempting to update email via edge function");
                const { data: updateResult, error: updateError } = await supabase.functions.invoke("admin-reset-staff-password", {
                  body: {
                    staff_id: editingStaff.id,
                    auth_id: editingStaff.auth_id,
                    new_email: staffData.email,
                    update_email_only: true
                  }
                });
                
                if (updateError) {
                  console.warn("Error updating user email via edge function:", updateError);
                } else {
                  console.log("Successfully updated user email via edge function");
                }
              }
            }
          } catch (updateEmailError) {
            console.error("Error updating user email in auth:", updateEmailError);
            // Still show success toast but log the error for debugging
            toast({
              title: "Warning",
              description: "Staff data updated but email sync failed. User may need to update email separately.",
              variant: "default"
            });
          }
        }

        // If there's an auth_id, update its metadata with the fuel pump ID
        if (editingStaff.auth_id) {
          // Get fuel pump name
          const { data: pumpData } = await supabase
            .from('fuel_pumps')
            .select('name')
            .eq('id', fuelPumpId)
            .single();
          
          // Try to update the user metadata
          try {
            // For own user or when we have appropriate permissions
            await supabase.auth.updateUser({
              data: { 
                fuelPumpId: fuelPumpId,
                fuelPumpName: pumpData?.name,
                role: staffData.role
              }
            });
            console.log(`Updated user metadata for ${staffData.email}`);
          } catch (metadataError) {
            console.error("Error updating user metadata:", metadataError);
          }
        }
      } else {
        // Add new staff
        const { data, error } = await supabase
          .from('staff')
          .insert([staffData])
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("New staff created:", data[0]);
        
          // If there's an auth_id, update its metadata with the fuel pump ID
          if (staffData.auth_id) {
            // Get fuel pump name
            const { data: pumpData } = await supabase
              .from('fuel_pumps')
              .select('name')
              .eq('id', fuelPumpId)
              .single();
          
            // Try to update the user metadata
            try {
              await supabase.auth.updateUser({
                data: { 
                  fuelPumpId: fuelPumpId,
                  fuelPumpName: pumpData?.name,
                  role: staffData.role
                }
              });
              console.log(`Updated user metadata with fuelPumpId for new staff: ${fuelPumpId}`);
            } catch (metadataError) {
              console.error("Error updating user metadata for new staff:", metadataError);
            }
          }
        
          toast({ 
            title: "Staff added", 
            description: `${staffData.name} has been added to the staff list` 
          });
        }
      }
      setFormOpen(false);
      // Refresh the staff list to ensure it's up to date with the latest data from the API
      if (fuelPumpId) {
        fetchStaff(fuelPumpId);
      }
    } catch (error: any) {
      console.error('Error saving staff:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!fuelPumpId) {
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to manage staff",
        variant: "destructive"
      });
      return;
    }

    if (confirm("Are you sure you want to remove this staff member?")) {
      try {
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', id)
          .eq('fuel_pump_id', fuelPumpId);
        
        if (error) throw error;
        
        toast({ 
          title: "Staff removed", 
          description: "Staff member has been removed" 
        });
        
        // Fetch updated staff list from the API
        if (fuelPumpId) {
          fetchStaff(fuelPumpId);
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
        toast({
          title: "Error",
          description: "Failed to remove staff member",
          variant: "destructive"
        });
      }
    }
  };

  // Filter staff based on search term
  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    staff,
    filteredStaff,
    editingStaff,
    formOpen,
    searchTerm,
    isLoading,
    setEditingStaff,
    setFormOpen,
    setSearchTerm,
    handleSaveStaff,
    handleDeleteStaff
  };
};
