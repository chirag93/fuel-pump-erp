
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
import { Check, Loader2 } from 'lucide-react';

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
    
    try {
      // Create the fuel pump record first
      const { data: pumpData, error: pumpError } = await supabase
        .from('fuel_pumps')
        .insert([
          {
            name: values.name,
            email: values.email,
            address: values.address,
            contact_number: values.contactNumber,
            status: 'active',
            created_by: user?.id
          }
        ])
        .select();
        
      if (pumpError) {
        toast({
          title: 'Error creating fuel pump',
          description: pumpError.message,
          variant: 'destructive',
        });
        return;
      }

      // Use the sign-up method instead of admin.createUser
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'admin', // Give them admin role for their fuel pump
            name: values.name
          }
        }
      });
      
      if (authError) {
        // If there's an error with auth, clean up the fuel pump record
        if (pumpData && pumpData.length > 0) {
          await supabase
            .from('fuel_pumps')
            .delete()
            .eq('id', pumpData[0].id);
        }
        
        toast({
          title: 'Error creating user',
          description: authError.message,
          variant: 'destructive',
        });
        return;
      }
      
      // Success
      toast({
        title: 'Fuel Pump Provisioned',
        description: `${values.name} has been successfully created`,
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
    } catch (error) {
      console.error('Error provisioning pump:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while provisioning the fuel pump.',
        variant: 'destructive',
      });
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
            Create a new fuel pump with manager account. Each fuel pump will have its own dedicated ERP system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-start">
              <Check className="mt-1 mr-2 h-5 w-5 flex-shrink-0" />
              <p>{successMessage}</p>
            </div>
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
            The fuel pump manager will be able to log in immediately and access their dedicated ERP system.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProvisionPump;
