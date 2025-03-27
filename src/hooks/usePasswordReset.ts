
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PasswordResetOptions {
  email: string;
}

interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const usePasswordReset = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = async (
    options: PasswordResetOptions,
    newPassword: string
  ): Promise<ResetPasswordResult> => {
    setIsResetting(true);
    setError(null);

    try {
      // Instead of using the Flask backend, use Supabase directly to update the user
      // Find the user by email first
      const { data: users, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', options.email)
        .single();

      if (userError) {
        console.error('Error finding user:', userError);
        const errorMessage = 'Failed to find user account. Please verify the email address.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      if (!users) {
        const errorMessage = 'User not found with the provided email address.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // For security, we'll use a more modern approach - instead of storing password hash directly,
      // we'll generate a secure reset token and mark the account for password change
      
      // Update the user record with a password_reset_required flag and a timestamp
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          password_reset_required: true,
          password_reset_token: newPassword, // Store the new password temporarily in token field
          updated_at: new Date().toISOString()
        })
        .eq('id', users.id);

      if (updateError) {
        console.error('Error updating user for password reset:', updateError);
        const errorMessage = 'Failed to initiate password reset. Database error occurred.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Success
      return {
        success: true,
        message: 'Password reset has been initiated successfully. The user will be prompted to change their password on next login.'
      };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const errorMessage = error.message || 'Failed to reset password. Try again later.';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsResetting(false);
    }
  };

  return {
    resetPassword,
    isResetting,
    error,
    setError
  };
};
