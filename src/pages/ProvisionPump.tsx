
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSuperAdminAuth } from '@/superadmin/contexts/SuperAdminAuthContext';
import { toast } from '@/hooks/use-toast';
import { superAdminApi } from '@/superadmin/api/superAdminApi';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2, AlertCircle } from 'lucide-react';
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
  const { user } = useSuperAdminAuth();
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
      // Call our API to provision a new fuel pump
      const result = await superAdminApi.provisionFuelPump({
        name: values.name,
        email: values.email.trim(),
        address: values.address,
        contact_number: values.contactNumber,
        created_by: user?.id
      }, values.password);
      
      if (!result.success) {
        setErrorMessage(result.error || "Failed to provision fuel pump");
        return;
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
