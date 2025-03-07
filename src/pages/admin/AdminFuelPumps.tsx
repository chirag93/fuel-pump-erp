import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Fuel, Plus, Search, ExternalLink } from 'lucide-react';

interface FuelPump {
  id: number;
  name: string;
  location: string;
  petrol_capacity: number;
  diesel_capacity: number;
  petrol_current_level: number;
  diesel_current_level: number;
  created_at: string;
}

const AdminFuelPumps = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: fuelPumps, isLoading } = useQuery({
    queryKey: ['fuelPumps'],
    queryFn: async () => {
      const response = await fetch('/api/fuelpumps/');
      if (!response.ok) {
        throw new Error('Failed to fetch fuel pumps');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  const filteredPumps = fuelPumps.filter((pump: FuelPump) => 
    pump.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pump.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fuel Pumps</h1>
          <p className="text-muted-foreground">Manage all the fuel pumps in your network.</p>
        </div>
        <Button asChild>
          <Link to="/admin/fuel-pumps/create">
            <Plus className="mr-2 h-4 w-4" />
            Add New Pump
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pumps by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Petrol Level</TableHead>
                  <TableHead>Diesel Level</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPumps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Fuel className="h-8 w-8 mb-2" />
                        <p>No fuel pumps found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPumps.map((pump: FuelPump) => (
                    <TableRow key={pump.id}>
                      <TableCell className="font-medium">{pump.name}</TableCell>
                      <TableCell>{pump.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${(pump.petrol_current_level / pump.petrol_capacity) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((pump.petrol_current_level / pump.petrol_capacity) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${(pump.diesel_current_level / pump.diesel_capacity) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((pump.diesel_current_level / pump.diesel_capacity) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(pump.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/fuel-pumps/${pump.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFuelPumps;
