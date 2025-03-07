
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, GasPump, Users, UserPlus, Droplets } from 'lucide-react';

// User creation form schema
const userFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type UserFormData = z.infer<typeof userFormSchema>;

// Refill form schema
const refillFormSchema = z.object({
  fuel_type: z.enum(['Petrol', 'Diesel']),
  amount: z.string().refine(value => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Amount must be a positive number',
  }),
});

type RefillFormData = z.infer<typeof refillFormSchema>;

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  fuel_pump: number;
  fuel_pump_name?: string;
}

const AdminPumpDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRefillDialogOpen, setIsRefillDialogOpen] = useState(false);
  
  // Fetch fuel pump details
  const { data: fuelPump, isLoading } = useQuery({
    queryKey: ['fuelPump', id],
    queryFn: async () => {
      const response = await fetch(`/api/fuelpumps/${id}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch fuel pump details');
      }
      return response.json();
    }
  });
  
  // Fetch pump users
  const { data: pumpUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['pumpUsers', id],
    queryFn: async () => {
      const response = await fetch(`/api/users/?fuel_pump=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pump users');
      }
      return response.json();
    },
    enabled: !!id
  });

  // Form setup for creating users
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // Form setup for refilling tanks
  const refillForm = useForm<RefillFormData>({
    resolver: zodResolver(refillFormSchema),
    defaultValues: {
      fuel_type: 'Petrol',
      amount: '',
    },
  });

  // Mutation for creating a user
  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormData) => {
      const response = await fetch('/api/users/create_pump_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          fuel_pump: Number(id)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'User created successfully',
        description: `${data.user.username} has been added to ${fuelPump.name}.`,
      });
      setIsUserDialogOpen(false);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ['pumpUsers', id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create user',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCreatingUser(false);
    },
  });

  // Mutation for refilling tanks
  const refillTankMutation = useMutation({
    mutationFn: async (values: RefillFormData) => {
      const response = await fetch(`/api/fuelpumps/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(values.fuel_type === 'Petrol' ? {
            petrol_current_level: Math.min(
              fuelPump.petrol_current_level + Number(values.amount),
              fuelPump.petrol_capacity
            )
          } : {
            diesel_current_level: Math.min(
              fuelPump.diesel_current_level + Number(values.amount),
              fuelPump.diesel_capacity
            )
          })
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refill tank');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Tank refilled successfully',
        description: `${data.name}'s tank has been refilled.`,
      });
      setIsRefillDialogOpen(false);
      refillForm.reset();
      queryClient.invalidateQueries({ queryKey: ['fuelPump', id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to refill tank',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsRefilling(false);
    },
  });

  const onSubmitUser = (values: UserFormData) => {
    setIsCreatingUser(true);
    createUserMutation.mutate(values);
  };

  const onSubmitRefill = (values: RefillFormData) => {
    setIsRefilling(true);
    refillTankMutation.mutate(values);
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/fuel-pumps')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fuel Pumps
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{fuelPump.name}</h1>
          <p className="text-muted-foreground">{fuelPump.location}</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isRefillDialogOpen} onOpenChange={setIsRefillDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Droplets className="mr-2 h-4 w-4" />
                Refill Tank
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refill Fuel Tank</DialogTitle>
                <DialogDescription>
                  Add fuel to this pump's tank.
                </DialogDescription>
              </DialogHeader>
              <Form {...refillForm}>
                <form onSubmit={refillForm.handleSubmit(onSubmitRefill)} className="space-y-4">
                  <FormField
                    control={refillForm.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <FormControl>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            {...field}
                          >
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={refillForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (L)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isRefilling} className="w-full">
                    {isRefilling ? 'Refilling...' : 'Refill Tank'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Pump User</DialogTitle>
                <DialogDescription>
                  Add a new staff user to operate this fuel pump.
                </DialogDescription>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isCreatingUser} className="w-full">
                    {isCreatingUser ? 'Creating...' : 'Create User'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <GasPump className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Petrol Tank</CardTitle>
                <CardDescription>Current capacity and level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Level</p>
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(fuelPump.petrol_current_level / fuelPump.petrol_capacity) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {fuelPump.petrol_current_level.toFixed(2)} L
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((fuelPump.petrol_current_level / fuelPump.petrol_capacity) * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Capacity</p>
                      <p className="text-lg">{fuelPump.petrol_capacity.toLocaleString()} L</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Remaining</p>
                      <p className="text-lg">{fuelPump.petrol_current_level.toLocaleString()} L</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Diesel Tank</CardTitle>
                <CardDescription>Current capacity and level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Level</p>
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(fuelPump.diesel_current_level / fuelPump.diesel_capacity) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {fuelPump.diesel_current_level.toFixed(2)} L
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((fuelPump.diesel_current_level / fuelPump.diesel_capacity) * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Capacity</p>
                      <p className="text-lg">{fuelPump.diesel_capacity.toLocaleString()} L</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Remaining</p>
                      <p className="text-lg">{fuelPump.diesel_current_level.toLocaleString()} L</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Pump Information</CardTitle>
              <CardDescription>Details about this fuel pump</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-lg">{fuelPump.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-lg">{fuelPump.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-lg">{new Date(fuelPump.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pump Users</CardTitle>
              <CardDescription>Staff accounts that can operate this fuel pump</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">Loading users...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pumpUsers?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center h-24">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Users className="h-8 w-8 mb-2" />
                              <p>No users found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pumpUsers?.map((user: User) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setIsUserDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPumpDetail;
