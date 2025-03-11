
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Truck, Book, FileText } from 'lucide-react';
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
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  indentBooklets: IndentBooklet[];
  setIndentBooklets: React.Dispatch<React.SetStateAction<IndentBooklet[]>>;
  transactions: TransactionWithDetails[];
  customerId: string;
}

const CustomerTabs = ({ 
  customer, 
  vehicles, 
  setVehicles, 
  indentBooklets, 
  setIndentBooklets, 
  transactions,
  customerId
}: CustomerTabsProps) => {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <Building className="mr-2 h-4 w-4" />
          Customer Details
        </TabsTrigger>
        <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <Truck className="mr-2 h-4 w-4" />
          Vehicles
        </TabsTrigger>
        <TabsTrigger value="booklets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <Book className="mr-2 h-4 w-4" />
          Indent Booklets
        </TabsTrigger>
        <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <FileText className="mr-2 h-4 w-4" />
          Transactions
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        <CustomerDetailsTab customer={customer} />
      </TabsContent>
      
      <TabsContent value="vehicles">
        <VehiclesTab 
          vehicles={vehicles} 
          setVehicles={setVehicles} 
          customerId={customerId} 
        />
      </TabsContent>
      
      <TabsContent value="booklets">
        <BookletsTab 
          indentBooklets={indentBooklets} 
          setIndentBooklets={setIndentBooklets} 
          customerId={customerId} 
        />
      </TabsContent>
      
      <TabsContent value="transactions">
        <TransactionsTab transactions={transactions} />
      </TabsContent>
    </Tabs>
  );
};

export default CustomerTabs;
