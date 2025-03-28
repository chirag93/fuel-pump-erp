
import { useParams } from 'react-router-dom';
import CustomerHeader from '@/components/customers/CustomerHeader';
import CustomerTabs from '@/components/customers/CustomerTabs';
import { useCustomerData } from '@/components/customers/hooks/useCustomerData';
import { useEffect } from 'react';

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
