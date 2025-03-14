
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useTankUnloads } from "@/hooks/useTankUnloads";

interface RecentUnloadsTableProps {
  refreshTrigger?: number;
}

const RecentUnloadsTable = ({ refreshTrigger }: RecentUnloadsTableProps) => {
  const { recentUnloads, isLoading } = useTankUnloads(refreshTrigger);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Unloads</CardTitle>
        <CardDescription>
          Recently recorded fuel deliveries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : recentUnloads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No recent unloads found
                  </TableCell>
                </TableRow>
              ) : (
                recentUnloads.map((unload) => (
                  <TableRow key={unload.id}>
                    <TableCell className="font-medium">
                      {format(new Date(unload.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{unload.vehicle_number}</TableCell>
                    <TableCell>{unload.fuel_type}</TableCell>
                    <TableCell>{unload.quantity.toLocaleString()} L</TableCell>
                    <TableCell>₹{unload.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentUnloadsTable;
