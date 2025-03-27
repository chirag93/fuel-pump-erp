
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordConfirm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if this is a valid password reset session
    const hash = location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      setError('Invalid password reset link. Please request a new password reset.');
    }
  }, [location]);

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
      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        throw updateError;
      }

      // Try to get the user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // Check if user is associated with a fuel pump
        const { data: fuelPump } = await supabase
          .from('fuel_pumps')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        
        if (fuelPump && fuelPump.status === 'pending_reset') {
          // Reset the fuel pump status back to active
          await supabase
            .from('fuel_pumps')
            .update({ status: 'active' })
            .eq('id', fuelPump.id);
        }
      }
      
      setIsComplete(true);
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });

      // Give user time to see the success message before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      <Card className="w-full max-w-md shadow-lg relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {isComplete 
              ? "Your password has been updated successfully." 
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 mb-4 text-sm text-destructive">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}
          
          {isComplete ? (
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Password Reset Complete</h3>
              <p className="text-muted-foreground">
                Your password has been updated successfully. You will be redirected to the login page shortly.
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
        {isComplete && (
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ResetPasswordConfirm;
