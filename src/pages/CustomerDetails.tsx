
import { useParams } from 'react-router-dom';
import CustomerHeader from '@/components/customers/CustomerHeader';
import CustomerTabs from '@/components/customers/CustomerTabs';
import { useCustomerData } from '@/components/customers/hooks/useCustomerData';

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = id || '';
  
  const {
    customer,
    vehicles,
    indentBooklets,
    transactions,
    isLoading,
    setVehicles,
    setIndentBooklets
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
        />
      )}
    </div>
  );
};

export default CustomerDetails;
