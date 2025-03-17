
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, FuelPump } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GasPump, 
  Search, 
  Plus, 
  RefreshCcw, 
  Loader2,
  Mail, 
  MapPin,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const FuelPumpsPage = () => {
  const [fuelPumps, setFuelPumps] = useState<FuelPump[]>([]);
  const [filteredPumps, setFilteredPumps] = useState<FuelPump[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFuelPumps = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('fuel_pumps')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setFuelPumps(data || []);
      setFilteredPumps(data || []);
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
  
  // Function to handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPumps(fuelPumps);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = fuelPumps.filter(
        pump => 
          pump.name.toLowerCase().includes(query) ||
          pump.email.toLowerCase().includes(query) ||
          (pump.address && pump.address.toLowerCase().includes(query))
      );
      setFilteredPumps(filtered);
    }
  }, [searchQuery, fuelPumps]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFuelPumps();
    setIsRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Fuel pump list has been updated',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Pumps</h1>
          <p className="text-muted-foreground">
            Manage all fuel pumps in the network
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Link to="/super-admin/provision">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add New Pump
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search fuel pumps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-1 pb-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPumps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <GasPump className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No fuel pumps found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery.trim() !== '' 
              ? 'No fuel pumps match your search criteria' 
              : 'No fuel pumps have been provisioned yet'}
          </p>
          {searchQuery.trim() !== '' ? (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          ) : (
            <Link to="/super-admin/provision">
              <Button>Provision Your First Pump</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPumps.map((pump) => (
            <Card key={pump.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{pump.name}</CardTitle>
                    <CardDescription>
                      Created on {new Date(pump.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={pump.status === 'active' ? 'default' : 'secondary'}>
                    {pump.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start">
                  <Mail className="mt-0.5 mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pump.email}</span>
                </div>
                
                {pump.address && (
                  <div className="flex items-start">
                    <MapPin className="mt-0.5 mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{pump.address}</span>
                  </div>
                )}
                
                {pump.contact_number && (
                  <div className="flex items-start">
                    <Phone className="mt-0.5 mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{pump.contact_number}</span>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FuelPumpsPage;
