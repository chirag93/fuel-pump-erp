
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
      // Find the fuel pump by email
      const { data: fuelPump, error: fuelPumpError } = await supabase
        .from('fuel_pumps')
        .select('*')
        .eq('email', options.email)
        .single();

      if (fuelPumpError) {
        console.error('Error finding fuel pump:', fuelPumpError);
        const errorMessage = 'Failed to find fuel pump account. Please verify the email address.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      if (!fuelPump) {
        const errorMessage = 'Fuel pump not found with the provided email address.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Instead of using password_reset_required field (which doesn't exist),
      // we'll set a note in the status field to indicate password reset
      // Store the new password as a temporary status message
      const statusMessage = `pending_reset:${newPassword}`;
      
      const { error: updateError } = await supabase
        .from('fuel_pumps')
        .update({
          status: statusMessage
        })
        .eq('id', fuelPump.id);

      if (updateError) {
        console.error('Error updating fuel pump for password reset:', updateError);
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
