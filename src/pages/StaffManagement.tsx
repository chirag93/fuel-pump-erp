
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Search, UserCog, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import StaffForm from '@/components/staff/StaffForm';

// Mock data for staff
interface Staff {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  salary: number;
  joiningDate: string;
  assignedPumps: string[];
}

const initialStaffData: Staff[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    role: 'Pump Operator',
    salary: 15000,
    joiningDate: '2023-01-15',
    assignedPumps: ['Pump-1', 'Pump-2']
  },
  {
    id: '2',
    name: 'Priya Patel',
    phone: '8765432109',
    email: 'priya@example.com',
    role: 'Cashier',
    salary: 18000,
    joiningDate: '2022-11-10',
    assignedPumps: ['Pump-3']
  }
];

const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>(initialStaffData);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const handleSaveStaff = (staffData: any) => {
    if (editingStaff) {
      // Update existing staff
      setStaff(staff.map(s => s.id === editingStaff.id ? { ...staffData, id: editingStaff.id } : s));
      toast({ title: "Staff updated", description: `${staffData.name}'s information has been updated` });
    } else {
      // Add new staff
      const newStaff = {
        ...staffData,
        id: `S${staff.length + 1}`.padStart(3, '0'),
        salary: parseFloat(staffData.salary)
      };
      setStaff([...staff, newStaff]);
      toast({ title: "Staff added", description: `${staffData.name} has been added to the staff list` });
    }
    setFormOpen(false);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      setStaff(staff.filter(s => s.id !== id));
      toast({ title: "Staff removed", description: "Staff member has been removed" });
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
          {filteredStaff.length === 0 ? (
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
                        {staffMember.assignedPumps.map((pump) => (
                          <span key={pump} className="bg-muted text-xs px-2 py-1 rounded-full">
                            {pump}
                          </span>
                        ))}
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
              ₹{staff.reduce((total, s) => total + s.salary, 0).toLocaleString()}
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
              {(new Set(staff.flatMap(s => s.assignedPumps))).size}
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
