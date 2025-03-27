
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface PasswordResetOptions {
  email: string;
  accessToken: string | undefined;
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
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000';
      const resetEndpoint = `${apiUrl}/api/reset-password`;
      
      console.log('Attempting to reset password using API endpoint:', resetEndpoint);
      
      // Call the backend API with proper error handling
      const response = await fetch(resetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.accessToken}`
        },
        body: JSON.stringify({ 
          email: options.email,
          newPassword 
        })
      });
      
      console.log('Password reset API response status:', response.status);

      // Check if the response is successful
      if (!response.ok) {
        // Handle error responses
        const contentType = response.headers.get('content-type');
        let errorMessage = '';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
          } catch (jsonError) {
            const errorText = await response.text();
            console.error('Failed to parse JSON response:', errorText.substring(0, 200));
            errorMessage = `Error ${response.status}: The server response was not valid JSON`;
          }
        } else {
          const errorText = await response.text();
          console.error('Server response:', response.status, errorText.substring(0, 200));
          
          if (response.status === 404) {
            errorMessage = `The reset password API endpoint was not found. Please verify the Flask backend is running at ${apiUrl}`;
          } else {
            errorMessage = `Server error (${response.status}): The API endpoint may not be responding correctly`;
          }
        }
        
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
      
      // Parse successful response
      const contentType = response.headers.get('content-type');
      let result: any = { success: true };
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
          
          if (!result.success) {
            setError(result.error || 'Error resetting password');
            return {
              success: false,
              error: result.error || 'Error resetting password'
            };
          }
        } catch (jsonError) {
          console.error('Failed to parse success response JSON:', jsonError);
          const errorMessage = 'The server returned an invalid success response format';
          setError(errorMessage);
          return {
            success: false,
            error: errorMessage
          };
        }
      }
      
      return {
        success: true,
        message: result.message || 'Password reset successfully'
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
