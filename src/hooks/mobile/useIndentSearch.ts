
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';
import { useToast } from '@/hooks/use-toast';

interface UseIndentSearchProps {
  setIndentNumber: (value: string) => void;
  setSelectedBooklet: (id: string) => void;
  setSelectedCustomer: (id: string) => void;
  setSelectedCustomerName: (name: string) => void;
  setSelectedVehicle: (id: string) => void;
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
    if (!searchIndentNumber) {
      setSearchError('Please enter an indent number to search');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    
    try {
      console.log('Searching for indent number:', searchIndentNumber);
      
      const fuelPumpId = await getFuelPumpId();
      if (!fuelPumpId) {
        setSearchError('Could not determine your fuel pump');
        setIsSearching(false);
        return;
      }
      
      // First, find the booklet that contains this indent number
      const { data: booklets, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('id, customer_id, start_number, end_number')
        .eq('fuel_pump_id', fuelPumpId);
        
      if (bookletError) {
        console.error('Error fetching booklets:', bookletError);
        setSearchError('Error searching for indent booklets');
        setIsSearching(false);
        return;
      }
      
      if (!booklets || booklets.length === 0) {
        setSearchError('No indent booklets found');
        setIsSearching(false);
        return;
      }
      
      // Find a booklet where the indent number is within range
      const indentNum = parseInt(searchIndentNumber);
      if (isNaN(indentNum)) {
        setSearchError('Invalid indent number');
        setIsSearching(false);
        return;
      }
      
      const matchingBooklet = booklets.find(
        booklet => parseInt(booklet.start_number) <= indentNum && parseInt(booklet.end_number) >= indentNum
      );
      
      if (!matchingBooklet) {
        setSearchError('No booklet found for this indent number');
        setIsSearching(false);
        return;
      }
      
      // Check if the indent has already been used
      const { data: existingIndent, error: existingError } = await supabase
        .from('indents')
        .select('id')
        .eq('indent_number', searchIndentNumber)
        .eq('booklet_id', matchingBooklet.id);
        
      if (existingError) {
        console.error('Error checking if indent exists:', existingError);
        setSearchError('Error checking if indent number exists');
        setIsSearching(false);
        return;
      }
      
      if (existingIndent && existingIndent.length > 0) {
        setSearchError('This indent number has already been used');
        setIsSearching(false);
        return;
      }
      
      // Now get the customer details
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', matchingBooklet.customer_id)
        .eq('fuel_pump_id', fuelPumpId)
        .maybeSingle();
        
      if (customerError) {
        console.error('Error fetching customer:', customerError);
        setSearchError('Error fetching customer information');
        setIsSearching(false);
        return;
      }
      
      if (!customer) {
        setSearchError('Customer not found for this booklet');
        setIsSearching(false);
        return;
      }
      
      // Set the values in the form
      setIndentNumber(searchIndentNumber);
      setSelectedBooklet(matchingBooklet.id);
      setSelectedCustomer(customer.id);
      setSelectedCustomerName(customer.name);
      
      // Reset vehicle selection
      setSelectedVehicle('');
      
      toast({
        title: "Success",
        description: `Found indent booklet for ${customer.name}`
      });
      
    } catch (error) {
      console.error('Error in searchByIndentNumber:', error);
      setSearchError('An error occurred while searching');
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
