
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Staff } from '@/hooks/useStaffManagement';

interface StaffSummaryCardsProps {
  staff: Staff[];
}

export function StaffSummaryCards({ staff }: StaffSummaryCardsProps) {
  return (
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
  );
}
