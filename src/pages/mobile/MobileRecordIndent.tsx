
import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { useIndentForm } from '@/hooks/mobile/useIndentForm';
import { useIndentSearch } from '@/hooks/mobile/useIndentSearch';
import { useIndentValidation } from '@/hooks/mobile/useIndentValidation';
import { useSaveIndent } from '@/hooks/mobile/useSaveIndent';
import { IndentSearchForm } from '@/components/mobile/indent/IndentSearchForm';
import { IndentFormDetails } from '@/components/mobile/indent/IndentFormDetails';
import { SuccessDialog } from '@/components/mobile/indent/SuccessDialog';
import { useToast } from '@/hooks/use-toast';

const MobileRecordIndent = () => {
  const { toast } = useToast();
  const [currentFuelPrice, setCurrentFuelPrice] = useState<number>(0);
  
  const {
    fuelType,
    setFuelType,
    amount,
    setAmount,
    quantity,
    setQuantity,
    discountAmount,
    date,
    selectedStaff,
    isSubmitting: formSubmitting,
    staff,
    indentNumber,
    setIndentNumber,
    indentNumberError: formIndentNumberError,
    setIndentNumberError: formSetIndentNumberError,
    searchIndentNumber,
    setSearchIndentNumber,
    selectedCustomer,
    setSelectedCustomer,
    selectedCustomerName,
    setSelectedCustomerName,
    selectedVehicle,
    setSelectedVehicle,
    selectedVehicleNumber,
    setSelectedVehicleNumber,
    selectedBooklet,
    setSelectedBooklet,
    successDialogOpen,
    setSuccessDialogOpen,
    successDetails,
    setSuccessDetails,
    vehicles,
    resetForm
  } = useIndentForm();

  const { indentNumberError, setIndentNumberError, validateIndentNumber } = useIndentValidation();

  const {
    isSearching,
    searchError,
    searchByIndentNumber,
    setSearchError
  } = useIndentSearch({
    setIndentNumber,
    setSelectedBooklet,
    setSelectedCustomer,
    setSelectedCustomerName,
    setSelectedVehicle,
    searchIndentNumber
  });

  // Create a wrapped validateIndentNumber function that passes the needed parameters
  const wrappedValidateIndentNumber = async () => {
    return await validateIndentNumber(indentNumber, selectedBooklet);
  };

  const { isSubmitting, handleSaveIndent } = useSaveIndent({
    indentNumber,
    selectedCustomer,
    selectedCustomerName,
    selectedVehicle,
    selectedVehicleNumber,
    selectedBooklet,
    amount,
    quantity,
    fuelType,
    discountAmount,
    date,
    selectedStaff,
    validateIndentNumber: wrappedValidateIndentNumber,
    setSuccessDetails,
    setSuccessDialogOpen,
    resetForm
  });

  const handleFuelPriceChange = (price: number) => {
    setCurrentFuelPrice(price);
  };

  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <MobileHeader title="Record Indent" />
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Indent Details</h2>
          </div>
          
          <div className="space-y-4">
            <IndentSearchForm
              searchIndentNumber={searchIndentNumber}
              setSearchIndentNumber={setSearchIndentNumber}
              isSearching={isSearching}
              searchError={searchError}
              onSearch={searchByIndentNumber}
              selectedCustomerName={selectedCustomerName}
            />
            
            <IndentFormDetails
              indentNumber={indentNumber}
              setIndentNumber={setIndentNumber}
              indentNumberError={indentNumberError || formIndentNumberError}
              selectedCustomerName={selectedCustomerName}
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              setSelectedVehicle={setSelectedVehicle}
              setSelectedVehicleNumber={setSelectedVehicleNumber}
              fuelType={fuelType}
              setFuelType={setFuelType}
              amount={amount}
              setAmount={setAmount}
              quantity={quantity}
              setQuantity={setQuantity}
              onFuelPriceChange={handleFuelPriceChange}
              currentFuelPrice={currentFuelPrice}
            />
            
            <div className="bg-muted/50 p-3 rounded-md mt-2">
              <p className="text-sm text-muted-foreground">
                Mobile indents require approval from the web system before being processed.
              </p>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleSaveIndent}
              disabled={isSubmitting || !indentNumber || !selectedCustomer || !selectedVehicle || !quantity}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : 'Submit for Approval'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <SuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        successDetails={successDetails}
      />
    </div>
  );
};

export default MobileRecordIndent;
