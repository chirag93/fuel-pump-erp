
import { useParams } from 'react-router-dom';
import CustomerHeader from '@/components/customers/CustomerHeader';
import CustomerTabs from '@/components/customers/CustomerTabs';
import { useCustomerData } from '@/components/customers/hooks/useCustomerData';

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = id || '';
  
  console.log('Customer details page: Loading customer ID:', customerId);
  
  const {
    customer,
    vehicles,
    indentBooklets,
    transactions,
    isLoading,
    setVehicles,
    setIndentBooklets,
    refreshData
  } = useCustomerData(customerId);

  return (
    <div className="space-y-6">
      <CustomerHeader customer={customer} isLoading={isLoading} />
      
      {customer && (
        <CustomerTabs 
          customer={customer}
          vehicles={vehicles}
          setVehicles={setVehicles}
          indentBooklets={indentBooklets}
          setIndentBooklets={setIndentBooklets}
          transactions={transactions}
          customerId={customerId}
          refreshData={refreshData}
        />
      )}
    </div>
  );
};

export default CustomerDetails;
