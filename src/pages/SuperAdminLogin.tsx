
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Key, Lock, Shield } from 'lucide-react';
import { useSuperAdminAuth } from '@/superadmin/contexts/SuperAdminAuthContext';
import { superAdminApi } from '@/superadmin/api/superAdminApi';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SuperAdminLogin = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Special handling for superuser@example.com account (super admin)
  const handleSuperUserLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get the super admin user record
      const { data: superAdmin, error: adminError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', 'superuser@example.com')
        .maybeSingle();
      
      if (adminError) {
        console.error('Error checking for super admin:', adminError);
      }
      
      // If super admin doesn't exist, create it
      if (!superAdmin) {
        // Create the default super admin
        const { data, error } = await supabase
          .from('super_admins')
          .insert({
            id: 'sa-' + new Date().getTime(),
            name: 'Super User',
            email: 'superuser@example.com'
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating super admin:', error);
          throw new Error('Failed to create super admin account');
        }
        
        console.log('Created super admin account');
        toast({
          title: 'Super Admin Account Created',
          description: 'The super admin account has been provisioned.',
        });
      }
      
      // Proceed with login - Pass email and password
      await login('superuser@example.com', 'admin123');
      
      const from = location.state?.from?.pathname || '/super-admin/dashboard';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Error during super admin login:', error);
      setError(error.message || 'Failed to log in as super admin');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/super-admin/dashboard';
      navigate(from, { replace: true });
    }
    
    // If user came from regular login and email is superuser@example.com,
    // handle special super admin login flow
    if (location.state?.email === 'superuser@example.com') {
      handleSuperUserLogin();
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Special case for system super admin
    if (username.toLowerCase() === 'superuser' && token === 'admin123') {
      handleSuperUserLogin();
      return;
    }

    try {
      // Check token against database
      const isValid = await superAdminApi.checkSuperAdminAccess(token);
      
      if (!isValid) {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Pass username and token as parameters
      await login(username, token);
      
      const from = location.state?.from?.pathname || '/super-admin/dashboard';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      <Card className="w-full max-w-md shadow-lg relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                Super Admin
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access super admin features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter username"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="token"
                  type="password"
                  placeholder="Enter access token"
                  className="pl-9"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
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
            <div className="text-center">
              <Button 
                variant="link" 
                className="text-primary"
                onClick={() => navigate('/login')}
              >
                Regular User Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminLogin;
