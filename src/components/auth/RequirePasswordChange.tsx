
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RequirePasswordChangeProps {
  onComplete: () => void;
  userEmail: string;
}

const RequirePasswordChange = ({ onComplete, userEmail }: RequirePasswordChangeProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    toast({
      title: "Password change required",
      description: "Your password has been reset by an administrator. Please set a new password to continue.",
      duration: 6000,
    });
  }, []);

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
      
      // Now update the password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        throw updateError;
      }

      // Update the fuel pump status back to active
      const { data: fuelPump, error: fetchError } = await supabase
        .from('fuel_pumps')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
        
      if (fetchError) {
        console.warn('Failed to fetch fuel pump for status update:', fetchError);
      } else if (fuelPump) {
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
        console.warn('Fuel pump not found for email:', userEmail);
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

export default RequirePasswordChange;
