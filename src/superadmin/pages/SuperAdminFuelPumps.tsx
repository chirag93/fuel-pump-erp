
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FuelPump, getAllFuelPumps } from '@/integrations/fuelPumps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search, RefreshCcw, Loader2, Check } from 'lucide-react';
import { DeleteFuelPumpDialog } from '@/components/superadmin/DeleteFuelPumpDialog';
import { toast } from '@/hooks/use-toast';

const SuperAdminFuelPumps = () => {
  const [fuelPumps, setFuelPumps] = useState<FuelPump[]>([]);
  const [filteredPumps, setFilteredPumps] = useState<FuelPump[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pumpToDelete, setPumpToDelete] = useState<FuelPump | null>(null);
  
  const fetchFuelPumps = async () => {
    try {
      setIsLoading(true);
      const data = await getAllFuelPumps();
      setFuelPumps(data);
      setFilteredPumps(data);
    } catch (error) {
      console.error('Error fetching fuel pumps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fuel pumps',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelPumps();
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPumps(fuelPumps);
    } else {
      const query = searchTerm.toLowerCase();
      const filtered = fuelPumps.filter(
        pump => 
          pump.name?.toLowerCase().includes(query) ||
          pump.email?.toLowerCase().includes(query) ||
          (pump.address && pump.address.toLowerCase().includes(query))
      );
      setFilteredPumps(filtered);
    }
  }, [searchTerm, fuelPumps]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFuelPumps();
    setIsRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Fuel pump list has been updated',
    });
  };
  
  const handleDeleteClick = (pump: FuelPump) => {
    setPumpToDelete(pump);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteComplete = () => {
    setDeleteDialogOpen(false);
    setPumpToDelete(null);
    fetchFuelPumps();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fuel Pumps Management</h1>
      
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fuel pumps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-10 px-4 w-full sm:w-auto flex items-center justify-center"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          <span className="ml-2 sm:hidden inline">Refresh</span>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Fuel Pumps</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredPumps.length === 0 ? (
            <div className="text-center py-6">
              <p>No fuel pumps found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPumps.map((pump) => (
                    <TableRow key={pump.id}>
                      <TableCell className="font-medium">{pump.name}</TableCell>
                      <TableCell>{pump.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {pump.status === 'active' ? (
                            <>
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span>Active</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Inactive</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(pump.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteClick(pump)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <DeleteFuelPumpDialog 
        isOpen={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        fuelPump={pumpToDelete}
        onDeleted={handleDeleteComplete}
      />
    </div>
  );
};

export default SuperAdminFuelPumps;
