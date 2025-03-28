
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Lock, Mail, Droplets } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import RequirePasswordChange from '@/components/auth/RequirePasswordChange';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Attempting login with email: ${email}`);
      
      // First check if this fuel pump account exists
      const { data: fuelPump, error: fuelPumpError } = await supabase
        .from('fuel_pumps')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (fuelPumpError) {
        console.error('Error checking fuel pump status:', fuelPumpError);
      }
      
      if (!fuelPump) {
        console.warn(`No fuel pump found with email: ${email}`);
        setError('No account found with this email address');
        setIsLoading(false);
        return;
      }
      
      console.log('Found fuel pump:', fuelPump);
      console.log('Attempting to sign in with Supabase auth...');

      // Use Supabase authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error during login:', authError);
        
        // Special handling for users with status "password_change_required"
        if (fuelPump && fuelPump.status === 'password_change_required') {
          console.log('Account requires password reset. Attempting to sign in with temporary password...');
          
          // Try with the default temporary password
          const { data: tempLoginData, error: tempLoginError } = await supabase.auth.signInWithPassword({
            email,
            password: 'admin123' // Default temporary password
          });
          
          if (!tempLoginError && tempLoginData?.user) {
            console.log('Successfully signed in with temporary password');
            setPasswordChangeRequired(true);
            setIsLoading(false);
            return;
          } else {
            console.error('Failed to sign in with temporary password:', tempLoginError);
            setError('This account requires a password reset. Please contact your administrator for the temporary password.');
            setIsLoading(false);
            return;
          }
        }
        
        setError(authError.message || 'Invalid login credentials');
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        console.log('Login successful, checking fuel pump status');
        
        // Check if user needs to change password
        if (fuelPump && fuelPump.status === 'password_change_required') {
          console.log('User needs to change password');
          setPasswordChangeRequired(true);
          setIsLoading(false);
          return;
        }

        // Call the login method from auth context to set up session
        await login(data.user.id, {
          id: data.user.id,
          username: email.split('@')[0],
          email: data.user.email,
          role: 'admin' // Default role, should be retrieved from profiles table in a real app
        }, rememberMe);
        
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        
        toast({
          title: "Login successful",
          description: "You have been logged in successfully.",
        });
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Error during login:', err);
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeComplete = async () => {
    try {
      // Get current session info
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        // Call the login method from auth context to set up session
        await login(sessionData.session.user.id, {
          id: sessionData.session.user.id,
          username: email.split('@')[0],
          email: sessionData.session.user.email,
          role: 'admin'
        }, rememberMe);
        
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        
        toast({
          title: "Login successful",
          description: "Your password has been updated and you've been logged in successfully.",
        });
      }
    } catch (error) {
      console.error('Error completing password change flow:', error);
      // If there's an issue, just hide the password change UI and show error
      setPasswordChangeRequired(false);
      setError('An error occurred after password change. Please try logging in again.');
    }
  };

  return (
    <>
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
        <Card className="w-full max-w-md shadow-lg relative z-10">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                  Fuel Pro 360
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 mb-4 text-sm text-destructive">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rememberMe" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-medium">
                  Remember me
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            <Button 
              variant="link" 
              className="px-0 text-sm"
              onClick={async () => {
                if (!email) {
                  setError('Please enter your email address to reset your password');
                  return;
                }
                
                try {
                  setIsLoading(true);
                  // Check if email exists in fuel_pumps
                  const { data: fuelPump, error: fuelPumpError } = await supabase
                    .from('fuel_pumps')
                    .select('*')
                    .eq('email', email)
                    .maybeSingle();

                  if (fuelPumpError) throw fuelPumpError;
                  
                  if (!fuelPump) {
                    setError('No account found with this email address');
                    return;
                  }
                  
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password-confirm`,
                  });
                  
                  if (error) throw error;
                  
                  // Update the fuel pump status to pending_reset
                  await supabase
                    .from('fuel_pumps')
                    .update({ status: 'pending_reset' })
                    .eq('id', fuelPump.id);
                  
                  toast({
                    title: "Password reset email sent",
                    description: "Check your inbox for the password reset link",
                  });
                } catch (error: any) {
                  console.error('Password reset error:', error);
                  setError(error.message || 'Failed to send password reset email');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Forgot password?
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Contact admin for new account
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Password change modal */}
      {passwordChangeRequired && (
        <RequirePasswordChange 
          onComplete={handlePasswordChangeComplete} 
          userEmail={email}
        />
      )}
    </>
  );
};

export default Login;
