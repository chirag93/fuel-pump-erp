
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Search, UserCog } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import StaffForm from '@/components/staff/StaffForm';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

// Staff interface reflecting the Supabase schema
interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: number;
  joining_date: string;
  assigned_pumps: string[];
  features?: string[];
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper function to safely convert Json to string array
  const convertJsonToStringArray = (jsonValue: Json | null): string[] => {
    if (!jsonValue) return [];
    
    // If it's already an array, map each item to string
    if (Array.isArray(jsonValue)) {
      return jsonValue.map(item => String(item));
    }
    
    // If it's a JSON string, parse it
    if (typeof jsonValue === 'string') {
      try {
        const parsed = JSON.parse(jsonValue);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item));
        }
      } catch (e) {
        console.error('Error parsing JSON array:', e);
      }
    }
    
    return [];
  };
  
  // Fetch staff data from Supabase
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Fetching staff data...");
      const { data, error } = await supabase
        .from('staff')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log("Staff data fetched:", data.length, "records");
        // Convert Json to string[] for assigned_pumps
        const formattedData = data.map(item => ({
          ...item,
          assigned_pumps: Array.isArray(item.assigned_pumps) 
            ? item.assigned_pumps.map(String)
            : convertJsonToStringArray(item.assigned_pumps)
        }));
        setStaff(formattedData as Staff[]);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);
  
  // Filter staff based on search term
  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormOpen(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormOpen(true);
  };

  const handleSaveStaff = async (staffData: any) => {
    try {
      console.log("Saving staff data via API:", staffData);
      
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', editingStaff.id);
          
        if (error) throw error;
        
        toast({ 
          title: "Staff updated", 
          description: `${staffData.name}'s information has been updated` 
        });
      } else {
        // Add new staff
        const { data, error } = await supabase
          .from('staff')
          .insert([staffData])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("New staff created:", data[0]);
          
          toast({ 
            title: "Staff added", 
            description: `${staffData.name} has been added to the staff list` 
          });
        }
      }
      setFormOpen(false);
      // Refresh the staff list to ensure it's up to date with the latest data from the API
      fetchStaff();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      try {
        const { error } = await supabase
          .from('staff')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        toast({ 
          title: "Staff removed", 
          description: "Staff member has been removed" 
        });
        
        // Fetch updated staff list from the API instead of manipulating local state
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
        toast({
          title: "Error",
          description: "Failed to remove staff member",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Button onClick={handleAddStaff}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, role or email"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff List</CardTitle>
              <CardDescription>Manage pump station staff</CardDescription>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading staff data...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No staff members found. Add your first staff member using the "Add Staff" button.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Assigned Pumps</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staffMember) => (
                  <TableRow key={staffMember.id}>
                    <TableCell className="font-medium">{staffMember.name}</TableCell>
                    <TableCell>{staffMember.role}</TableCell>
                    <TableCell>
                      <div>{staffMember.phone}</div>
                      <div className="text-sm text-muted-foreground">{staffMember.email}</div>
                    </TableCell>
                    <TableCell>₹{staffMember.salary.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {staffMember.assigned_pumps && Array.isArray(staffMember.assigned_pumps) ? 
                          staffMember.assigned_pumps.map((pump) => (
                            <span key={pump} className="bg-muted text-xs px-2 py-1 rounded-full">
                              {pump}
                            </span>
                          )) : 
                          <span className="text-xs text-muted-foreground">None assigned</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStaff(staffMember)}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(staffMember.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active staff members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{staff.reduce((total, s) => total + (s.salary || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly payroll</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Pump Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(new Set(staff.flatMap(s => s.assigned_pumps || []))).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pumps with assigned staff</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          </DialogHeader>
          <StaffForm 
            initialData={editingStaff}
            onSubmit={handleSaveStaff}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
