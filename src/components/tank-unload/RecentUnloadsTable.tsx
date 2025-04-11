
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useTankUnloads } from "@/hooks/useTankUnloads";
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from "lucide-react";

interface RecentUnloadsTableProps {
  refreshTrigger?: number;
  showAll?: boolean;
}

const RecentUnloadsTable = ({ refreshTrigger, showAll = false }: RecentUnloadsTableProps) => {
  const { isAuthenticated } = useAuth();
  const { recentUnloads, isLoading, error } = useTankUnloads(refreshTrigger, showAll ? 100 : 5, showAll);

  // If showAll is true, display all records, otherwise only show the first 5
  const displayedUnloads = showAll ? recentUnloads : recentUnloads.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{showAll ? "All Unloads" : "Recent Unloads"}</CardTitle>
        <CardDescription>
          {showAll ? "Complete history of fuel deliveries" : "Recently recorded fuel deliveries"}
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
                <TableHead>Tanker Rent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
                      <p className="text-muted-foreground">{error}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !isAuthenticated ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    Please sign in to view unload data
                  </TableCell>
                </TableRow>
              ) : displayedUnloads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No recent unloads found
                  </TableCell>
                </TableRow>
              ) : (
                displayedUnloads.map((unload) => (
                  <TableRow key={unload.id}>
                    <TableCell className="font-medium">
                      {format(new Date(unload.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{unload.vehicle_number}</TableCell>
                    <TableCell>{unload.fuel_type}</TableCell>
                    <TableCell>{unload.quantity.toLocaleString()} L</TableCell>
                    <TableCell>₹{unload.amount.toLocaleString()}</TableCell>
                    <TableCell>₹{unload.tanker_rent?.toLocaleString() || '0'}</TableCell>
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
