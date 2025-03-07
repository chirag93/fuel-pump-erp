
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Droplets, Users } from 'lucide-react';
import { CardFeature } from '@/components/ui/custom/CardFeature';
import { toast } from '@/hooks/use-toast';

// Display the current API URL being used from environment variables
const apiUrl = import.meta.env.VITE_API_URL || 'Default URL (not set)';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('Login form submitted for user:', username);
    
    try {
      const success = await login(username, password);
      console.log('Login result:', success);
      
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error in component:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="grid w-full max-w-5xl gap-8 rounded-2xl bg-card p-8 shadow-lg md:grid-cols-2">
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary md:mx-0">
              <Droplets size={28} />
            </div>
            <h1 className="text-3xl font-bold">Fuel Pump Management System</h1>
            <p className="text-muted-foreground">
              Sign in to your account to manage your fuel pump operations
            </p>
          </div>
          
          <div className="grid gap-4">
            <CardFeature
              icon={<Droplets size={24} />}
              title="Complete Management"
              description="Track staff, customers, inventory, and finances in one place"
              className="border-primary/20"
            />
            <CardFeature
              icon={<Users size={24} />}
              title="Staff & Customer Management"
              description="Manage staff schedules, payroll, and customer relationships"
              className="border-primary/20"
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-full space-y-6 rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold">Login</h2>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access your account
              </p>
              {error && (
                <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Demo Credentials:</p>
              <p>Admin: admin / admin123</p>
              <p>Staff: staff / staff123</p>
              <div className="mt-2 text-xs opacity-50">
                API URL: {apiUrl}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
