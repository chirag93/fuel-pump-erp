
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash, GasPump, Banknote, UserCircle } from 'lucide-react';

// Mock data for staff
const mockStaff = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    role: 'Pump Operator',
    salary: '₹15,000',
    joiningDate: '2023-01-15',
    assignedPumps: ['Pump-1', 'Pump-2'],
  },
  {
    id: '2',
    name: 'Priya Patel',
    phone: '8765432109',
    email: 'priya@example.com',
    role: 'Cashier',
    salary: '₹18,000',
    joiningDate: '2022-11-10',
    assignedPumps: ['Pump-3'],
  },
  {
    id: '3',
    name: 'Amit Kumar',
    phone: '7654321098',
    email: 'amit@example.com',
    role: 'Pump Operator',
    salary: '₹14,500',
    joiningDate: '2023-03-20',
    assignedPumps: ['Pump-4', 'Pump-5'],
  },
  {
    id: '4',
    name: 'Divya Singh',
    phone: '6543210987',
    email: 'divya@example.com',
    role: 'Manager',
    salary: '₹25,000',
    joiningDate: '2022-08-05',
    assignedPumps: ['All'],
  },
];

// Mock data for staff payroll
const mockPayroll = [
  {
    id: '1',
    staffId: '1',
    staffName: 'Rahul Sharma',
    month: 'June 2023',
    basicSalary: '₹15,000',
    overtimeHours: '10',
    overtimeAmount: '₹2,000',
    deductions: '₹1,200',
    netSalary: '₹15,800',
    status: 'Paid',
    paidOn: '2023-07-05',
  },
  {
    id: '2',
    staffId: '2',
    staffName: 'Priya Patel',
    month: 'June 2023',
    basicSalary: '₹18,000',
    overtimeHours: '5',
    overtimeAmount: '₹1,200',
    deductions: '₹1,500',
    netSalary: '₹17,700',
    status: 'Paid',
    paidOn: '2023-07-05',
  },
  {
    id: '3',
    staffId: '3',
    staffName: 'Amit Kumar',
    month: 'June 2023',
    basicSalary: '₹14,500',
    overtimeHours: '8',
    overtimeAmount: '₹1,600',
    deductions: '₹1,100',
    netSalary: '₹15,000',
    status: 'Pending',
    paidOn: '-',
  },
  {
    id: '4',
    staffId: '4',
    staffName: 'Divya Singh',
    month: 'June 2023',
    basicSalary: '₹25,000',
    overtimeHours: '0',
    overtimeAmount: '₹0',
    deductions: '₹2,500',
    netSalary: '₹22,500',
    status: 'Paid',
    paidOn: '2023-07-03',
  },
];

const StaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('staff-list');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const filteredStaff = mockStaff.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.phone.includes(searchTerm)
  );

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff(staffId);
    setActiveTab('staff-details');
  };

  const selectedStaffData = mockStaff.find(s => s.id === selectedStaff);
  const staffPayroll = mockPayroll.filter(p => p.staffId === selectedStaff);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-col md:flex-row">
        <div className="md:w-1/4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>
                Manage your staff and payroll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('staff-list')}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  All Staff
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('payroll')}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Payroll
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('pump-assignment')}
                >
                  <GasPump className="mr-2 h-4 w-4" />
                  Pump Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4">
          <Card>
            <CardHeader className="pb-2">
              {activeTab === 'staff-details' && selectedStaffData ? (
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{selectedStaffData.name}</CardTitle>
                    <CardDescription>
                      Staff details and management
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('staff-list')}>
                    Back to List
                  </Button>
                </div>
              ) : (
                <>
                  <CardTitle>
                    {activeTab === 'staff-list' && 'All Staff'}
                    {activeTab === 'payroll' && 'Payroll Management'}
                    {activeTab === 'pump-assignment' && 'Pump Assignment'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'staff-list' && 'View and manage all your staff members'}
                    {activeTab === 'payroll' && 'Manage staff payroll and salary details'}
                    {activeTab === 'pump-assignment' && 'Assign staff to pumps'}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent>
              {activeTab === 'staff-list' && (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search staff..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Assigned Pumps</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.length > 0 ? (
                        filteredStaff.map((staff) => (
                          <TableRow key={staff.id}>
                            <TableCell className="font-medium">{staff.name}</TableCell>
                            <TableCell>{staff.role}</TableCell>
                            <TableCell>{staff.phone}</TableCell>
                            <TableCell>{staff.assignedPumps.join(', ')}</TableCell>
                            <TableCell>{staff.salary}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSelectStaff(staff.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No staff found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </>
              )}

              {activeTab === 'staff-details' && selectedStaffData && (
                <div className="space-y-6">
                  <Tabs defaultValue="details">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="payroll">Payroll History</TabsTrigger>
                      <TabsTrigger value="shifts">Shift History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4 pt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Name</label>
                          <p className="text-lg">{selectedStaffData.name}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Role</label>
                          <p className="text-lg">{selectedStaffData.role}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-lg">{selectedStaffData.phone}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-lg">{selectedStaffData.email}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Joining Date</label>
                          <p className="text-lg">{selectedStaffData.joiningDate}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Salary</label>
                          <p className="text-lg font-semibold">{selectedStaffData.salary}</p>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Assigned Pumps</label>
                          <p className="text-lg">{selectedStaffData.assignedPumps.join(', ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button>Edit Details</Button>
                        <Button variant="outline">Update Salary</Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="payroll" className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Basic Salary</TableHead>
                            <TableHead>Overtime</TableHead>
                            <TableHead>Deductions</TableHead>
                            <TableHead>Net Salary</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid On</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staffPayroll.length > 0 ? (
                            staffPayroll.map((payroll) => (
                              <TableRow key={payroll.id}>
                                <TableCell className="font-medium">{payroll.month}</TableCell>
                                <TableCell>{payroll.basicSalary}</TableCell>
                                <TableCell>{payroll.overtimeAmount}</TableCell>
                                <TableCell>{payroll.deductions}</TableCell>
                                <TableCell className="font-semibold">{payroll.netSalary}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    payroll.status === 'Paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {payroll.status}
                                  </span>
                                </TableCell>
                                <TableCell>{payroll.paidOn}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center">
                                No payroll records found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    <TabsContent value="shifts" className="pt-4 text-center py-8">
                      <p>Shift history will be displayed here</p>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search payroll..." className="pl-8" />
                    </div>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Process Salary
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPayroll.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">{payroll.staffName}</TableCell>
                          <TableCell>{payroll.month}</TableCell>
                          <TableCell>{payroll.netSalary}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              payroll.status === 'Paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {payroll.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {payroll.status === 'Pending' && (
                                <Button variant="outline" size="sm">
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'pump-assignment' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Pump-1', 'Pump-2', 'Pump-3', 'Pump-4'].map((pump) => {
                      const assignedStaff = mockStaff.filter(s => 
                        s.assignedPumps.includes(pump) || s.assignedPumps.includes('All')
                      );
                      
                      return (
                        <Card key={pump}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{pump}</CardTitle>
                            <CardDescription>
                              {assignedStaff.length} staff assigned
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {assignedStaff.map(staff => (
                                <div key={staff.id} className="flex items-center justify-between border-b pb-2">
                                  <div>
                                    <p className="font-medium">{staff.name}</p>
                                    <p className="text-sm text-muted-foreground">{staff.role}</p>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    Remove
                                  </Button>
                                </div>
                              ))}
                              <Button size="sm" className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Assign Staff
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
