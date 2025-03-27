import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { getFuelPumpByEmail } from '@/integrations/fuelPumps';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Pump name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters long' }),
  contactNumber: z.string().min(10, { message: 'Contact number must be at least 10 characters' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const ProvisionPump = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      contactNumber: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // Trim the email to avoid whitespace issues
      const email = values.email.trim();
      console.log(`Attempting to provision pump with email: ${email}`);
      
      // Check if email already exists in fuel_pumps table
      const existingPump = await getFuelPumpByEmail(email);
      
      if (existingPump) {
        setErrorMessage(`A fuel pump with email "${email}" already exists. Please use a different email address.`);
        setIsLoading(false);
        return;
      }
      
      // As a double-check, perform a direct query to check unique constraint
      const { data: emailCheck, error: emailCheckError } = await supabase
        .from('fuel_pumps')
        .select('id, email')
        .ilike('email', email);
      
      if (emailCheckError) {
        console.error('Error checking email uniqueness:', emailCheckError);
      } else if (emailCheck && emailCheck.length > 0) {
        setErrorMessage(`A fuel pump with email "${email}" already exists (case-insensitive match). Please use a different email address.`);
        setIsLoading(false);
        return;
      }
      
      // 1. Create the fuel pump record first with active status
      const { data: pumpData, error: pumpError } = await supabase
        .from('fuel_pumps')
        .insert([
          {
            name: values.name,
            email: email,
            address: values.address,
            contact_number: values.contactNumber,
            status: 'active',
            created_by: user?.id
          }
        ])
        .select();
        
      if (pumpError) {
        console.error('Error creating fuel pump:', pumpError);
        toast({
          title: 'Error creating fuel pump',
          description: pumpError.message,
          variant: 'destructive',
        });
        setErrorMessage(pumpError.message || "Failed to create fuel pump");
        return;
      }

      if (!pumpData || pumpData.length === 0) {
        toast({
          title: 'Error creating fuel pump',
          description: 'No data returned from fuel pump creation',
          variant: 'destructive',
        });
        setErrorMessage("No data returned from fuel pump creation");
        return;
      }

      const pumpId = pumpData[0].id;
      console.log(`Successfully created fuel pump with ID: ${pumpId}`);

      // 2. Sign up a new user with the pump manager role and metadata about their fuel pump
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: values.password,
        options: {
          data: {
            role: 'pump_manager',
            name: values.name,
            fuel_pump_id: pumpId
          }
        }
      });
      
      if (authError) {
        // If there's an error with auth, clean up the fuel pump record
        await supabase
          .from('fuel_pumps')
          .delete()
          .eq('id', pumpId);
        
        console.error('Error creating user:', authError);
        toast({
          title: 'Error creating user',
          description: authError.message,
          variant: 'destructive',
        });
        setErrorMessage(authError.message || "Failed to create user account");
        return;
      }

      console.log('Successfully created auth user for fuel pump');

      // 3. Initialize default fuel settings for this new fuel pump
      const { error: settingsError } = await supabase
        .from('fuel_settings')
        .insert([
          {
            fuel_type: 'Petrol',
            current_price: 87.50,
            tank_capacity: 10000,
            current_level: 5000,
            fuel_pump_id: pumpId
          },
          {
            fuel_type: 'Diesel',
            current_price: 85.20,
            tank_capacity: 10000,
            current_level: 5000,
            fuel_pump_id: pumpId
          }
        ]);

      if (settingsError) {
        console.error('Error creating default fuel settings:', settingsError);
        // Continue anyway as this is not critical
      }

      // 4. Create default pump settings for the new fuel pump
      const { error: pumpSettingsError } = await supabase
        .from('pump_settings')
        .insert([
          {
            pump_number: '1',
            nozzle_count: 2,
            fuel_types: ['Petrol', 'Diesel'],
            fuel_pump_id: pumpId
          }
        ]);

      if (pumpSettingsError) {
        console.error('Error creating default pump settings:', pumpSettingsError);
        // Continue anyway as this is not critical
      }
      
      // Success
      toast({
        title: 'Fuel Pump Provisioned',
        description: `${values.name} has been successfully created with its own isolated ERP instance`,
      });
      
      setSuccessMessage(`Fuel pump "${values.name}" has been provisioned successfully. The manager can now log in using the provided email and password. They will be automatically directed to their specific ERP instance upon login.`);
      
      // Reset the form
      form.reset({
        name: '',
        email: '',
        address: '',
        contactNumber: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error provisioning pump:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while provisioning the fuel pump.',
        variant: 'destructive',
      });
      setErrorMessage(error.message || 'An unexpected error occurred while provisioning the fuel pump.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Provision New Fuel Pump</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>New Fuel Pump Details</CardTitle>
          <CardDescription>
            Create a new fuel pump with manager account. Each fuel pump will have its own dedicated ERP system with isolated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-start">
              <Check className="mt-1 mr-2 h-5 w-5 flex-shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Pump Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pump name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the fuel pump location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="pump@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for logging into the system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter full address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Set a password" {...field} />
                      </FormControl>
                      <FormDescription>
                        At least 8 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  'Provision New Fuel Pump'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            The fuel pump manager will be able to log in immediately and access their dedicated ERP system with isolated data.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProvisionPump;
