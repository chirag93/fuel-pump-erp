
import { useParams } from 'react-router-dom';
import CustomerHeader from '@/components/customers/CustomerHeader';
import CustomerTabs from '@/components/customers/CustomerTabs';
import { useCustomerData } from '@/components/customers/hooks/useCustomerData';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = id || '';
  
  console.log('Customer details page: Loading customer ID:', customerId);
  
  const {
    customer,
    vehicles,
    indents,
    indentBooklets,
    transactions,
    isLoading,
    isLoadingBooklets,
    setVehicles,
    setIndentBooklets,
    refreshData
  } = useCustomerData(customerId);

  useEffect(() => {
    if (indentBooklets && indentBooklets.length > 0) {
      console.log(`Customer details has ${indentBooklets.length} booklets:`, indentBooklets);
    } else {
      console.log('No indent booklets found in customer details');
    }
  }, [indentBooklets]);

  if (isLoading) {
    return (
      <Card className="mx-auto my-12 max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading customer details...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerHeader customer={customer} isLoading={isLoading} />
      
      {customer && (
        <CustomerTabs 
          customer={customer}
          vehicles={vehicles}
          setVehicles={setVehicles}
          indentBooklets={indentBooklets || []} 
          setIndentBooklets={setIndentBooklets}
          transactions={transactions}
          customerId={customerId}
          refreshData={refreshData}
          isLoadingBooklets={isLoadingBooklets}
        />
      )}
    </div>
  );
};

export default CustomerDetails;
