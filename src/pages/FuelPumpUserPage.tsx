
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpById } from '@/integrations/fuelPumps';
import { AlertCircle, ChevronLeft, User, Mail, MapPin, Phone, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const FuelPumpUserPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [fuelPump, setFuelPump] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/super-admin/login');
      return;
    }

    const fetchFuelPump = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        
        const pump = await getFuelPumpById(id);
        if (pump) {
          setFuelPump(pump);
        } else {
          toast({
            title: "Error",
            description: "Fuel pump not found",
            variant: "destructive"
          });
          navigate('/super-admin/fuel-pumps');
        }
      } catch (error) {
        console.error('Error fetching fuel pump:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFuelPump();
  }, [id, navigate, isSuperAdmin]);

  const handleResetPassword = async () => {
    // Basic validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsResettingPassword(true);
      setError(null);

      if (!fuelPump || !fuelPump.email) {
        throw new Error('Fuel pump email not found');
      }

      // Try direct path to Flask backend
      const baseURL = '/api/reset-password';
      
      console.log('Attempting to reset password using API endpoint:', baseURL);
      
      // Call our backend API with proper error handling
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          email: fuelPump.email,
          newPassword 
        })
      });
      
      console.log('Password reset API response status:', response.status);

      // Check if the response is successful
      if (!response.ok) {
        // Try to parse error response
        const contentType = response.headers.get('content-type');
        let errorMessage = '';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
          } catch (jsonError) {
            // Handle JSON parsing error
            const errorText = await response.text();
            console.error('Failed to parse JSON response:', errorText.substring(0, 200));
            errorMessage = `Error ${response.status}: The server response was not valid JSON`;
          }
        } else {
          // Handle non-JSON error responses
          const errorText = await response.text();
          console.error('Server response:', response.status, errorText.substring(0, 200));
          
          if (response.status === 404) {
            errorMessage = 'The reset password API endpoint was not found. This could be because the Flask backend is not running or the endpoint path is incorrect.';
          } else {
            errorMessage = `Server error (${response.status}): The API endpoint may not be responding correctly`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Error resetting password');
          }
        } catch (jsonError) {
          console.error('Failed to parse success response JSON:', jsonError);
          throw new Error('The server returned an invalid success response format');
        }
      } else {
        // Handle unexpected but successful response format
        console.warn('Unexpected content type in successful response:', contentType);
        // Assume success since response.ok is true
      }
      
      // Clear password fields
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Password Reset Successful",
        description: `The password for ${fuelPump.name} has been reset.`
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password. Try again later.');
      
      toast({
        title: "Password Reset Failed",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="animate-pulse"
            disabled
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="h-7 bg-muted rounded w-1/3"></div>
            <div className="h-5 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded w-full"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 bg-muted rounded w-1/4"></div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!fuelPump) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/super-admin/fuel-pumps')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Fuel Pumps
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Fuel Pump Not Found</CardTitle>
            <CardDescription>
              The requested fuel pump could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The fuel pump with ID {id} does not exist or has been removed.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/super-admin/fuel-pumps')}
            >
              Return to Fuel Pumps List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/super-admin/fuel-pumps')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Fuel Pumps
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fuel Pump Details</CardTitle>
            <CardDescription>
              View and manage details for this fuel pump
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{fuelPump?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {fuelPump?.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-sm">{fuelPump?.email}</p>
            </div>
            
            {fuelPump?.contact_number && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Contact Number</span>
                </div>
                <p className="text-sm">{fuelPump?.contact_number}</p>
              </div>
            )}
            
            {fuelPump?.address && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Address</span>
                </div>
                <p className="text-sm">{fuelPump?.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Change the password for this fuel pump's user account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="pt-2">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This action will immediately change the password for the fuel pump user. 
                  Make sure to communicate the new password securely.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleResetPassword} 
              disabled={isResettingPassword}
              className="w-full"
            >
              {isResettingPassword ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default FuelPumpUserPage;
