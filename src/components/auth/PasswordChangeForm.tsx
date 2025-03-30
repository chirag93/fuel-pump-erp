
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PasswordChangeFormProps {
  onComplete: () => void;
  userEmail: string;
}

const PasswordChangeForm = ({ onComplete, userEmail }: PasswordChangeFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Updating password for user:', userEmail);
      
      // Get the current user session to get user info
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      
      if (!sessionData.session?.user) {
        throw new Error('No active session found. Please try logging in again.');
      }
      
      // Get existing user metadata to preserve it
      const userId = sessionData.session.user.id;
      const existingMetadata = sessionData.session.user.user_metadata || {};
      
      // Update the password using Supabase, preserving metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: existingMetadata  // Preserve existing metadata
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        throw updateError;
      }

      // Check if user is a fuel pump admin or staff
      let isPumpAdmin = false;
      
      // First check if the user is a fuel pump admin
      const { data: fuelPump, error: fetchFuelPumpError } = await supabase
        .from('fuel_pumps')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (fuelPump) {
        isPumpAdmin = true;
        
        // Update the fuel pump status back to active
        const { error: fuelPumpError } = await supabase
          .from('fuel_pumps')
          .update({ status: 'active' })
          .eq('id', fuelPump.id);
        
        if (fuelPumpError) {
          console.warn('Failed to update fuel pump status after password change', fuelPumpError);
        } else {
          console.log('Successfully updated fuel pump status to active');
        }
      } else {
        // If not admin, check if staff
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id, auth_id, fuel_pump_id')
          .eq('auth_id', userId)
          .maybeSingle();
        
        if (staffData) {
          // Update a timestamp on the staff record to indicate password was changed
          const { error: updateStaffError } = await supabase
            .from('staff')
            .update({ password_updated_at: new Date().toISOString() })
            .eq('id', staffData.id);
          
          if (updateStaffError) {
            console.warn('Failed to update staff record after password change', updateStaffError);
          } else {
            console.log('Successfully updated staff record with password change timestamp');
          }
        }
      }
      
      // Refetch user metadata and store in localStorage for backup
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        // Save updated user session to localStorage
        try {
          const storedSession = localStorage.getItem('fuel_pro_session');
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession.user) {
              parsedSession.user = {
                ...parsedSession.user,
                ...data.user.user_metadata
              };
              localStorage.setItem('fuel_pro_session', JSON.stringify(parsedSession));
              console.log('Updated stored session with latest user metadata');
            }
          }
        } catch (parseError) {
          console.error('Error updating stored session:', parseError);
        }
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });

      // Notify parent component that password change is complete
      onComplete();
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Change Your Password</CardTitle>
          <CardDescription className="text-center">
            Your password has been reset. Please create a new password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 mb-4 text-sm text-destructive">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordChangeForm;
