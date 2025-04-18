import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  setPasswordChangeRequired: (required: boolean) => void;
  setRememberMe: (remember: boolean) => void;
  rememberMe: boolean;
  regularLogin: (userId: string, userData: any, rememberMe?: boolean) => Promise<boolean>;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

const LoginForm = ({ 
  email, 
  setEmail, 
  setPasswordChangeRequired, 
  setRememberMe,
  rememberMe,
  regularLogin 
}: LoginFormProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { updateUserState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getLoginAttempts = () => {
    try {
      const attempts = localStorage.getItem('login_attempts');
      if (!attempts) return { count: 0, timestamp: 0 };
      return JSON.parse(attempts);
    } catch (error) {
      console.error('Error parsing login attempts:', error);
      return { count: 0, timestamp: 0 };
    }
  };

  const saveLoginAttempts = (count: number) => {
    try {
      localStorage.setItem('login_attempts', JSON.stringify({
        count,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving login attempts:', error);
    }
  };

  const resetLoginAttempts = () => {
    localStorage.removeItem('login_attempts');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // Check for account lockout
    const attempts = getLoginAttempts();
    const now = Date.now();
    
    if (attempts.count >= MAX_LOGIN_ATTEMPTS && now - attempts.timestamp < LOCKOUT_TIME) {
      const minutesLeft = Math.ceil(((attempts.timestamp + LOCKOUT_TIME) - now) / 60000);
      setError(`Too many failed login attempts. Please try again in ${minutesLeft} minutes.`);
      setIsLoading(false);
      return;
    }
    
    // If lockout period has passed, reset the counter
    if (attempts.count >= MAX_LOGIN_ATTEMPTS && now - attempts.timestamp >= LOCKOUT_TIME) {
      resetLoginAttempts();
    }

    try {
      console.log(`Attempting login with email: ${email}`);
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        console.error('Auth error during login:', authError);
        
        // Increment failed login attempts
        const currentAttempts = getLoginAttempts();
        saveLoginAttempts(currentAttempts.count + 1);
        
        // More detailed error for invalid credentials
        if (authError.message.includes('Invalid login')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(authError.message || 'Login failed. Please try again.');
        }
        
        setIsLoading(false);
        return;
      }

      if (!data?.user) {
        // Increment failed login attempts
        const currentAttempts = getLoginAttempts();
        saveLoginAttempts(currentAttempts.count + 1);
        
        setError('Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }
      
      // Reset login attempts on successful login
      resetLoginAttempts();
      
      console.log('Authentication successful, user data:', {
        id: data.user.id,
        email: data.user.email,
        app_metadata: data.user.app_metadata,
        user_metadata: data.user.user_metadata
      });

      const isMobileOnlyUser = data.user.user_metadata?.mobile_only_access === true;
      const isMobile = window.innerWidth <= 768; // Simple mobile check
      
      if (isMobileOnlyUser && !isMobile && !window.location.pathname.includes('/mobile')) {
        console.log('Mobile-only user attempting to access web app');
        // Sign out the user immediately
        await supabase.auth.signOut();
        
        setError('You do not have permission to login to the web app. Please contact your administrator or use the mobile app.');
        setIsLoading(false);
        return;
      }

      let userRole: 'admin' | 'staff' | 'super_admin' = 'staff';
      let fuelPumpId = null;
      let fuelPumpName = null;
      let staffData = null;
      
      // Try to find the fuel pump details - needed for both staff and admin
      const { data: matchedFuelPump } = await supabase
        .rpc('get_fuel_pump_by_email', { email_param: email.toLowerCase() });
      
      const fuelPump = matchedFuelPump && Array.isArray(matchedFuelPump) && matchedFuelPump.length > 0 
        ? matchedFuelPump[0] 
        : null;
        
      if (fuelPump) {
        console.log('Found fuel pump:', fuelPump);
        
        // Check if user needs to change password (for admin)
        if (fuelPump.status === 'password_change_required') {
          console.log('Admin needs to change password');
          setPasswordChangeRequired(true);
          setIsLoading(false);
          return;
        }
        
        // If email matches fuel pump, this is an admin user
        if (data.user.email.toLowerCase() === fuelPump.email.toLowerCase()) {
          userRole = 'admin';
          fuelPumpId = fuelPump.id;
          fuelPumpName = fuelPump.name;
          console.log(`User is an admin for fuel pump: ${fuelPumpId} (${fuelPumpName})`);
        }
      }
      
      if (userRole !== 'admin') {
        // Check for staff record by auth_id (most reliable method)
        const { data: staffByAuthData } = await supabase
          .from('staff')
          .select('id, role, fuel_pump_id, name, auth_id')
          .eq('auth_id', data.user.id)
          .maybeSingle();
        
        if (staffByAuthData) {
          staffData = staffByAuthData;
          userRole = staffByAuthData.role as 'admin' | 'staff';
          fuelPumpId = staffByAuthData.fuel_pump_id;
          console.log(`User is staff with role ${userRole} for fuel pump: ${fuelPumpId} (found by auth_id)`);
          
          // Get fuel pump name
          if (fuelPumpId) {
            const { data: pumpData } = await supabase
              .from('fuel_pumps')
              .select('name, status')
              .eq('id', fuelPumpId)
              .maybeSingle();
              
            if (pumpData) {
              fuelPumpName = pumpData.name;
              
              // Check if staff needs to change password
              if (pumpData.status === 'password_change_required') {
                console.log('Staff needs to change password');
                setPasswordChangeRequired(true);
                setIsLoading(false);
                return;
              }
            }
          }
        } else {
          // Check if this user is in the staff table by email as fallback
          const { data: staffByEmailData } = await supabase
            .from('staff')
            .select('id, role, fuel_pump_id, name, auth_id')
            .eq('email', data.user.email)
            .maybeSingle();
          
          if (staffByEmailData) {
            staffData = staffByEmailData;
            userRole = staffByEmailData.role as 'admin' | 'staff';
            fuelPumpId = staffByEmailData.fuel_pump_id;
            
            // If the staff record doesn't have auth_id but email matches, update the auth_id
            if (!staffByEmailData.auth_id) {
              await supabase
                .from('staff')
                .update({ auth_id: data.user.id })
                .eq('id', staffByEmailData.id);
              
              console.log(`Updated staff record with auth_id: ${data.user.id}`);
            }
            
            // Get fuel pump name
            if (fuelPumpId) {
              const { data: pumpData } = await supabase
                .from('fuel_pumps')
                .select('name, status')
                .eq('id', fuelPumpId)
                .maybeSingle();
                
              if (pumpData) {
                fuelPumpName = pumpData.name;
                
                // Check if staff needs to change password
                if (pumpData.status === 'password_change_required') {
                  console.log('Staff needs to change password');
                  setPasswordChangeRequired(true);
                  setIsLoading(false);
                  return;
                }
              }
            }
          }
        }
      }
      
      // Check if user is a super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();
    
      // Use explicit type guard for super admin
      if (superAdmin) {
        // Redirect to super admin login page with credentials
        navigate('/super-admin/login', { 
          state: { 
            email,
            attemptedLogin: true 
          } 
        });
        setIsLoading(false);
        return;
      }

      // Fixed comparison by checking for specific string value rather than type comparison
      if (!userRole || (!fuelPumpId && userRole !== 'super_admin')) {
        // Check if the fuel pump ID is in user metadata as last resort
        if (data.user.user_metadata?.fuelPumpId) {
          fuelPumpId = data.user.user_metadata.fuelPumpId;
          fuelPumpName = data.user.user_metadata.fuelPumpName;
          userRole = data.user.user_metadata.role || userRole;
          console.log(`Found fuel pump ID in user metadata: ${fuelPumpId}`);
        } else {
          console.warn('Could not determine fuel pump ID or role for user');
          setError('Your account is not properly linked to a fuel pump. Please contact support.');
          setIsLoading(false);
          return;
        }
      }

      if (fuelPumpId || userRole) {
        try {
          await supabase.auth.updateUser({
            data: { 
              fuelPumpId: fuelPumpId,
              fuelPumpName: fuelPumpName,
              role: userRole,
              staffId: staffData?.id
            }
          });
          console.log(`Updated user metadata with fuelPumpId: ${fuelPumpId} and role: ${userRole}`);
        } catch (metadataError) {
          console.error('Failed to update user metadata:', metadataError);
          // Non-critical error, continue with login
        }
      }

      // Prepare user data for context - ensure role is of the correct type
      const userData = {
        id: data.user.id,
        username: email.split('@')[0],
        email: data.user.email,
        role: userRole as 'admin' | 'staff' | 'super_admin',
        fuelPumpId: fuelPumpId,
        fuelPumpName: fuelPumpName,
        staffId: staffData?.id,
        mobileOnlyAccess: data.user.user_metadata?.mobile_only_access || false
      };

      const loginSuccess = await regularLogin(data.user.id, userData, rememberMe);
      
      // Update the auth context user state directly for immediate effect
      updateUserState(userData);
      
      if (loginSuccess) {
        console.log('Login successful, storing session data with fuel pump info');
        
        // Store in localStorage for persistence and backup
        const sessionData = {
          user: userData
        };
        
        localStorage.setItem('fuel_pro_session', JSON.stringify(sessionData));
        
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        
        toast({
          title: "Login successful",
          description: `You have been logged in successfully${fuelPumpName ? ` to ${fuelPumpName}` : ''}.`,
        });
      } else {
        setError('Failed to initialize session. Please try again.');
      }
    } catch (err: any) {
      console.error('Error during login:', err);
      setError(err.message || 'An error occurred during login.');
      
      // Increment failed login attempts
      const currentAttempts = getLoginAttempts();
      saveLoginAttempts(currentAttempts.count + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
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
  };

  return (
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
            autoComplete="email"
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
            autoComplete="current-password"
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
      {error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
      <div className="flex justify-between gap-2 pt-2">
        <Button 
          type="button"
          variant="link" 
          className="px-0 text-sm"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          Contact admin for new account
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
