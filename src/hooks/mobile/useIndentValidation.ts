
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { getFuelPumpId } from '@/integrations/utils';

export const useIndentValidation = () => {
  const [indentNumberError, setIndentNumberError] = useState('');

  // Validate indent number against booklet range and duplicates
  const validateIndentNumber = async (indentNum: string, selectedBooklet: string): Promise<boolean> => {
    if (!indentNum || !selectedBooklet) {
      setIndentNumberError('Indent number and booklet are required');
      return false;
    }
    
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        console.error('No fuel pump ID available');
        setIndentNumberError('Could not verify fuel pump ID');
        return false;
      }
      
      // Get booklet details to check range
      const { data: booklet, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('start_number, end_number')
        .eq('id', selectedBooklet)
        .eq('fuel_pump_id', fuelPumpId)
        .maybeSingle();
        
      if (bookletError) {
        console.error('Error fetching booklet details:', bookletError);
        setIndentNumberError('Could not verify booklet details');
        return false;
      }
      
      if (!booklet) {
        setIndentNumberError('Booklet not found');
        return false;
      }
      
      // Check if number is within range
      const startNum = parseInt(booklet.start_number);
      const endNum = parseInt(booklet.end_number);
      const currentNum = parseInt(indentNum);
      
      if (isNaN(currentNum)) {
        setIndentNumberError('Please enter a valid number');
        return false;
      }
      
      if (currentNum < startNum || currentNum > endNum) {
        setIndentNumberError(`Indent number must be between ${startNum} and ${endNum}`);
        return false;
      }
      
      // Check if this indent number has already been used
      const { data: existingIndent, error: existingError } = await supabase
        .from('indents')
        .select('id')
        .eq('indent_number', indentNum)
        .eq('booklet_id', selectedBooklet)
        .eq('fuel_pump_id', fuelPumpId);
        
      if (existingError) {
        console.error('Error checking existing indent:', existingError);
        setIndentNumberError('Could not verify if indent number exists');
        return false;
      }
      
      if (existingIndent && existingIndent.length > 0) {
        setIndentNumberError('This indent number has already been used in this booklet');
        return false;
      }
      
      // Also check if this indent number has been used as id in indents table
      const { data: existingIndentById, error: existingByIdError } = await supabase
        .from('indents')
        .select('id')
        .eq('id', indentNum)
        .eq('fuel_pump_id', fuelPumpId);
        
      if (existingByIdError) {
        console.error('Error checking existing indent by ID:', existingByIdError);
        setIndentNumberError('Could not verify if indent number exists as ID');
        return false;
      }
      
      if (existingIndentById && existingIndentById.length > 0) {
        setIndentNumberError('This indent number has already been used as an ID');
        return false;
      }
      
      // All checks passed
      setIndentNumberError('');
      return true;
    } catch (error) {
      console.error('Error validating indent number:', error);
      setIndentNumberError('Error validating indent number');
      return false;
    }
  };

  return {
    indentNumberError,
    setIndentNumberError,
    validateIndentNumber
  };
};
