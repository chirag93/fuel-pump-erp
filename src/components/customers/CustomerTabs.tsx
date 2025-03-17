
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerDetailsTab from './CustomerDetailsTab';
import VehiclesTab from './VehiclesTab';
import BookletsTab from './BookletsTab';
import TransactionsTab from './TransactionsTab';
import { Customer, Vehicle, IndentBooklet, Transaction } from '@/integrations/supabase/client';

interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

interface CustomerTabsProps {
  customer: Customer;
  vehicles: Vehicle[];
  indentBooklets: IndentBooklet[];
  transactions: TransactionWithDetails[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  setIndentBooklets: React.Dispatch<React.SetStateAction<IndentBooklet[]>>;
  customerId: string;
  refreshData?: () => void;
}

const CustomerTabs = ({ 
  customer, 
  vehicles, 
  indentBooklets, 
  transactions, 
  setVehicles, 
  setIndentBooklets,
  customerId,
  refreshData
}: CustomerTabsProps) => {
  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        <TabsTrigger value="booklets">Indent Booklets</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="space-y-4">
        <CustomerDetailsTab customer={customer} />
      </TabsContent>
      <TabsContent value="vehicles" className="space-y-4">
        <VehiclesTab 
          vehicles={vehicles} 
          customerId={customer.id} 
          customerName={customer.name}
          setVehicles={setVehicles}
        />
      </TabsContent>
      <TabsContent value="booklets" className="space-y-4">
        <BookletsTab 
          booklets={indentBooklets} 
          customerId={customer.id}
          customerName={customer.name}
          setIndentBooklets={setIndentBooklets}
        />
      </TabsContent>
      <TabsContent value="transactions" className="space-y-4">
        <TransactionsTab 
          transactions={transactions} 
          customerName={customer.name}
          customer={customer}
          customerId={customerId}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CustomerTabs;
