
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Droplets } from 'lucide-react';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';
import LoginForm from '@/components/auth/LoginForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const { login: regularLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handlePasswordChangeComplete = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        // Determine user role
        let userRole = 'staff';
        
        // Check if this is an admin account
        const { data: fuelPump } = await supabase
          .from('fuel_pumps')
          .select('email')
          .eq('email', sessionData.session.user.email)
          .maybeSingle();
          
        if (fuelPump) {
          userRole = 'admin';
        } else {
          // Check if this user is in the staff table
          const { data: staffData } = await supabase
            .from('staff')
            .select('role')
            .eq('email', sessionData.session.user.email)
            .maybeSingle();
            
          if (staffData) {
            userRole = staffData.role;
          }
        }
        
        // Call the login method from auth context to set up session
        await regularLogin(sessionData.session.user.id, {
          id: sessionData.session.user.id,
          username: email.split('@')[0],
          email: sessionData.session.user.email,
          role: userRole
        }, rememberMe);
        
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
        
        toast({
          title: "Login successful",
          description: "Your password has been updated and you've been logged in successfully.",
        });
      }
    } catch (error) {
      console.error('Error completing password change flow:', error);
      setPasswordChangeRequired(false);
      setError('An error occurred after password change. Please try again.');
    }
  };

  // Auto-fill email if redirected from super admin login page
  useEffect(() => {
    if (location.state?.email && location.state?.attemptedLogin) {
      setEmail(location.state.email);
      setError('Please use the Super Admin login page to access super admin features.');
    }
  }, [location.state]);

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
            <LoginForm 
              email={email}
              setEmail={setEmail}
              setPasswordChangeRequired={setPasswordChangeRequired}
              setRememberMe={setRememberMe}
              rememberMe={rememberMe}
              regularLogin={regularLogin}
            />
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                className="text-primary"
                onClick={() => navigate('/super-admin/login')}
              >
                Super Admin Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password change modal */}
      {passwordChangeRequired && (
        <PasswordChangeForm 
          onComplete={handlePasswordChangeComplete} 
          userEmail={email}
        />
      )}
    </>
  );
};

export default Login;
