
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserRound, Phone, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';
import { MobileHeader } from '@/components/mobile/MobileHeader';

const MobileCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        console.error('No fuel pump ID available');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, address, balance')
        .eq('fuel_pump_id', fuelPumpId)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <MobileHeader title="Customers" />
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-9"
            placeholder="Search by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Loading customers...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <UserRound className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No customers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <Link to={`/customers/${customer.id}`} key={customer.id}>
              <Card className="hover:bg-muted/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <UserRound className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base truncate">{customer.name}</h3>
                      
                      {customer.phone && (
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                      )}
                      
                      {customer.address && (
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    
                    {customer.balance > 0 && (
                      <div className="bg-amber-100 dark:bg-amber-950 px-2 py-1 rounded text-amber-800 dark:text-amber-200 text-sm whitespace-nowrap">
                        ₹{customer.balance.toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileCustomers;
