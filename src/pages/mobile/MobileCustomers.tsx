
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, PhoneCall, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

const MobileCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        setCustomers(data || []);
        setFilteredCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(
      customer => 
        customer.name.toLowerCase().includes(query) ||
        (customer.phone && customer.phone.includes(query))
    );
    
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Customers</h1>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{customer.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {customer.phone && (
                  <div className="flex items-center text-sm">
                    <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="text-primary">
                      {customer.phone}
                    </a>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{customer.address}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="text-sm font-medium">Balance: </span>
                    <span className={`${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{Math.abs(customer.balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <Link to={`/customers/${customer.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileCustomers;
