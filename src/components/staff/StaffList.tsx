
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, UserCog, Smartphone } from 'lucide-react';
import { Staff } from '@/hooks/useStaffManagement';

interface StaffListProps {
  staff: Staff[];
  isLoading: boolean;
  onEdit: (staff: Staff) => void;
  onDelete: (id: string) => void;
}

export function StaffList({ staff, isLoading, onEdit, onDelete }: StaffListProps) {
  return (
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
        ) : staff.length === 0 ? (
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
                <TableHead>Access Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell className="font-medium">{staffMember.name}</TableCell>
                  <TableCell>{staffMember.role}</TableCell>
                  <TableCell>
                    <div>{staffMember.phone}</div>
                    <div className="text-sm text-muted-foreground">{staffMember.email}</div>
                  </TableCell>
                  <TableCell>₹{staffMember.salary.toLocaleString()}</TableCell>
                  <TableCell>
                    {staffMember.mobile_only_access ? (
                      <div className="flex items-center text-sm">
                        <Smartphone className="h-4 w-4 text-primary mr-1" />
                        Mobile Only
                      </div>
                    ) : (
                      <span className="text-sm">Full Access</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(staffMember)}
                    >
                      <UserCog className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(staffMember.id)}
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
  );
}
