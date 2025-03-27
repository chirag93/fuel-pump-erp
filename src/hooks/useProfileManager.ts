
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProfileUpdateData {
  username?: string;
}

export interface PasswordUpdateData {
  newPassword: string;
}

export function useProfileManager() {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  /**
   * Update user profile information
   */
  const updateProfile = async (userId: string, data: ProfileUpdateData) => {
    try {
      setIsUpdatingProfile(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      toast({
        title: "Update failed",
        description: error.message || "Failed to update your profile",
        variant: "destructive",
      });
      
      return { success: false, error };
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  /**
   * Update user password
   */
  const updatePassword = async ({ newPassword }: PasswordUpdateData) => {
    try {
      setIsUpdatingPassword(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      toast({
        title: "Password update failed",
        description: error.message || "Failed to update your password",
        variant: "destructive",
      });
      
      return { success: false, error };
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return {
    isUpdatingProfile,
    isUpdatingPassword,
    updateProfile,
    updatePassword
  };
}
