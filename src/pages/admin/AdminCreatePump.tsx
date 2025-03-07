
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Pump name must be at least 3 characters' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters' }),
  petrol_capacity: z.string().refine(value => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Petrol capacity must be a positive number',
  }),
  diesel_capacity: z.string().refine(value => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Diesel capacity must be a positive number',
  }),
  petrol_current_level: z.string().refine(value => !isNaN(Number(value)) && Number(value) >= 0, {
    message: 'Petrol level must be a non-negative number',
  }),
  diesel_current_level: z.string().refine(value => !isNaN(Number(value)) && Number(value) >= 0, {
    message: 'Diesel level must be a non-negative number',
  }),
});

type FormData = z.infer<typeof formSchema>;

const AdminCreatePump = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      petrol_capacity: '10000',
      diesel_capacity: '10000',
      petrol_current_level: '5000',
      diesel_current_level: '5000',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const response = await fetch('/api/fuelpumps/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          location: values.location,
          petrol_capacity: Number(values.petrol_capacity),
          diesel_capacity: Number(values.diesel_capacity),
          petrol_current_level: Number(values.petrol_current_level),
          diesel_current_level: Number(values.diesel_current_level),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create fuel pump');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Fuel pump created successfully',
        description: `${data.name} has been added to your network.`,
      });
      navigate('/admin/fuel-pumps');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create fuel pump',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCreating(false);
    },
  });

  const onSubmit = (values: FormData) => {
    setIsCreating(true);
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/fuel-pumps')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fuel Pumps
        </Button>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Fuel Pump</h1>
        <p className="text-muted-foreground">Add a new fuel pump to your network.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pump Details</CardTitle>
          <CardDescription>
            Enter the details for the new fuel pump station.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. East Side Fuels" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique name for this fuel pump
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 123 Main Street, City" {...field} />
                      </FormControl>
                      <FormDescription>
                        Physical location of the pump
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="petrol_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Petrol Tank Capacity (L)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diesel_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diesel Tank Capacity (L)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="petrol_current_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Petrol Level (L)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diesel_current_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Diesel Level (L)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Creating...' : 'Create Fuel Pump'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCreatePump;
