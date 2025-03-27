
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
    options: PasswordResetOptions
  ): Promise<ResetPasswordResult> => {
    setIsResetting(true);
    setError(null);

    try {
      // First, find the fuel pump by email to ensure it exists
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

      // Use Supabase's built-in password reset functionality
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        options.email,
        {
          redirectTo: `${window.location.origin}/reset-password-confirm`
        }
      );

      if (resetError) {
        console.error('Error sending password reset email:', resetError);
        const errorMessage = resetError.message || 'Failed to send password reset email.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Set a flag in the fuel_pump record to indicate a pending reset
      const { error: updateError } = await supabase
        .from('fuel_pumps')
        .update({
          status: 'pending_reset'
        })
        .eq('id', fuelPump.id);

      if (updateError) {
        console.error('Error updating fuel pump status:', updateError);
        // This isn't fatal since the reset email was sent, but we log it
        console.warn('Failed to update fuel pump status after sending reset email');
      }

      // Success
      return {
        success: true,
        message: 'Password reset instructions have been sent to the email address. Please check your inbox.'
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

  // New function for admin-initiated forced password reset
  const adminForcePasswordReset = async (
    email: string,
    tempPassword: string
  ): Promise<ResetPasswordResult> => {
    setIsResetting(true);
    setError(null);

    try {
      // Find the fuel pump by email
      const { data: fuelPump, error: fuelPumpError } = await supabase
        .from('fuel_pumps')
        .select('*')
        .eq('email', email)
        .single();

      if (fuelPumpError || !fuelPump) {
        const errorMessage = 'Fuel pump not found with the provided email address.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Make API call to the backend to handle the password update
      const apiUrl = `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/admin-reset-password`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        },
        body: JSON.stringify({
          email,
          newPassword: tempPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to reset password. Server error occurred.';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Mark the fuel pump as requiring password change
      const { error: updateError } = await supabase
        .from('fuel_pumps')
        .update({
          status: 'password_change_required'
        })
        .eq('id', fuelPump.id);

      if (updateError) {
        console.warn('Failed to update fuel pump status after password reset', updateError);
      }

      return {
        success: true,
        message: 'Password has been reset. The user will be required to change their password on next login.'
      };
    } catch (error: any) {
      console.error('Error in admin force password reset:', error);
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
    adminForcePasswordReset,
    isResetting,
    error,
    setError
  };
};
