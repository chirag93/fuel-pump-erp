
import { useParams } from 'react-router-dom';
import CustomerHeader from '@/components/customers/CustomerHeader';
import CustomerTabs from '@/components/customers/CustomerTabs';
import { useCustomerData } from '@/components/customers/hooks/useCustomerData';

interface TransactionWithDetails {
  id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  staff_id: string;
  date: string;
  fuel_type: string;
  amount: number;
  quantity: number;
  payment_method: string;
  indent_id: string | null;
  created_at?: string;
  vehicle_number?: string;
  customer_name?: string;
}

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
    <div className="space-y-6 p-4 md:p-6">
      <CustomerHeader customer={customer} isLoading={isLoading} />
      
      {customer && (
        <CustomerTabs 
          customer={customer}
          vehicles={vehicles}
          setVehicles={setVehicles}
          indentBooklets={indentBooklets}
          setIndentBooklets={setIndentBooklets}
          transactions={transactions as TransactionWithDetails[]}
          customerId={customerId}
        />
      )}
    </div>
  );
};

export default CustomerDetails;
