
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Droplets, Users } from 'lucide-react';
import { CardFeature } from '@/components/ui/custom/CardFeature';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      }
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
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <p>Admin: admin@example.com / admin123</p>
              <p>Staff: staff@example.com / staff123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
