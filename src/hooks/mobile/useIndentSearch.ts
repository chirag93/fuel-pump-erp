
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';

interface UseIndentSearchProps {
  setIndentNumber: (value: string) => void;
  setSelectedBooklet: (value: string) => void;
  setSelectedCustomer: (value: string) => void;
  setSelectedCustomerName: (value: string) => void;
  setSelectedVehicle: (value: string) => void;
  searchIndentNumber: string;
}

export const useIndentSearch = ({
  setIndentNumber,
  setSelectedBooklet,
  setSelectedCustomer,
  setSelectedCustomerName,
  setSelectedVehicle,
  searchIndentNumber
}: UseIndentSearchProps) => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const searchByIndentNumber = async () => {
    // Clear previous error
    setSearchError('');
    
    if (!searchIndentNumber) {
      setSearchError('Please enter an indent number to search');
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('Searching for indent number:', searchIndentNumber);
      
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        console.error('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to search indents",
          variant: "destructive"
        });
        setIsSearching(false);
        return;
      }
      
      // First check if this indent number exists in any booklet
      const { data: bookletData, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('fuel_pump_id', fuelPumpId)
        .or(`start_number.lte.${searchIndentNumber},end_number.gte.${searchIndentNumber}`)
        .order('issued_date', { ascending: false });

      if (bookletError) {
        console.error('Error searching for booklet:', bookletError);
        throw bookletError;
      }

      if (!bookletData || bookletData.length === 0) {
        setSearchError('No indent booklet contains this number');
        setIsSearching(false);
        return;
      }

      // Find the booklet where this number falls within range
      const matchingBooklet = bookletData.find(b => 
        parseInt(b.start_number) <= parseInt(searchIndentNumber) && 
        parseInt(b.end_number) >= parseInt(searchIndentNumber)
      );

      if (!matchingBooklet) {
        setSearchError('The indent number is not in any active booklet range');
        setIsSearching(false);
        return;
      }

      // Check if this indent number has already been used
      const { data: existingIndent, error: existingError } = await supabase
        .from('indents')
        .select('*')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('indent_number', searchIndentNumber);

      if (existingError) {
        console.error('Error checking existing indent:', existingError);
        throw existingError;
      }

      if (existingIndent && existingIndent.length > 0) {
        setSearchError('This indent number has already been used');
        setIsSearching(false);
        return;
      }

      // Get customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('id', matchingBooklet.customer_id)
        .single();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        throw customerError;
      }

      // Set form data from search results
      setIndentNumber(searchIndentNumber);
      setSelectedBooklet(matchingBooklet.id);
      setSelectedCustomer(customerData.id);
      setSelectedCustomerName(customerData.name);
      
      // Fetch vehicles for this customer
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('customer_id', matchingBooklet.customer_id)
        .eq('fuel_pump_id', fuelPumpId)
        .limit(1);

      if (vehicleError) {
        console.error('Error fetching vehicle:', vehicleError);
      } else if (vehicleData && vehicleData.length > 0) {
        setSelectedVehicle(vehicleData[0].id);
      }
      
    } catch (error) {
      console.error('Error during indent search:', error);
      setSearchError('An error occurred while searching for this indent number');
    } finally {
      setIsSearching(false);
    }
  };

  return {
    isSearching,
    searchError,
    searchByIndentNumber,
    setSearchError
  };
};
