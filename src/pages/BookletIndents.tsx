
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase, Indent, IndentBooklet, Customer, Transaction } from '@/integrations/supabase/client';

interface IndentWithDetails extends Indent {
  vehicle_number?: string;
  transaction?: Transaction | null;
}

const BookletIndents = () => {
  const { customerId, bookletId } = useParams<{ customerId: string; bookletId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [booklet, setBooklet] = useState<IndentBooklet | null>(null);
  const [indents, setIndents] = useState<IndentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (customerId && bookletId) {
      fetchData(customerId, bookletId);
    }
  }, [customerId, bookletId]);

  const fetchData = async (customerId: string, bookletId: string) => {
    setIsLoading(true);
    try {
      // Fetch customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData as Customer);

      // Fetch booklet data
      const { data: bookletData, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('id', bookletId)
        .single();

      if (bookletError) throw bookletError;
      
      const typedBooklet: IndentBooklet = {
        ...bookletData,
        status: bookletData.status as 'Active' | 'Completed' | 'Cancelled'
      };
      
      setBooklet(typedBooklet);

      // Fetch all indents for this booklet
      const { data: indentsData, error: indentsError } = await supabase
        .from('indents')
        .select(`*, vehicles(number)`)
        .eq('booklet_id', bookletId);

      if (indentsError) throw indentsError;

      // Process indents to include vehicle number
      const processedIndents = indentsData.map(indent => ({
        ...indent,
        vehicle_number: indent.vehicles ? indent.vehicles.number : 'Unknown',
      })) as IndentWithDetails[];

      // For each indent, fetch the associated transaction
      const indentsWithTransactions = await Promise.all(
        processedIndents.map(async (indent) => {
          const { data: transactionData, error: transactionError } = await supabase
            .from('transactions')
            .select('*')
            .eq('indent_id', indent.indent_number)
            .maybeSingle();

          if (transactionError) {
            console.error('Error fetching transaction:', transactionError);
            return indent;
          }

          return {
            ...indent,
            transaction: transactionData
          };
        })
      );

      setIndents(indentsWithTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Booklet Indents</h1>
        <Link to={`/customer/${customerId}`}>
          <Button variant="outline" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Customer
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {customer && booklet && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{customer.name}</CardTitle>
                <CardDescription>
                  Indent Booklet: {booklet.start_number} - {booklet.end_number}
                  <span className="ml-2 px-2 py-1 text-xs rounded-full inline-block align-middle ml-2 
                    ${booklet.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                    booklet.status === 'Active' ? 'bg-blue-100 text-blue-800' : 
                    'bg-red-100 text-red-800'}"
                  >
                    {booklet.status}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Issued Date</p>
                    <p className="font-medium">{new Date(booklet.issued_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Used Indents</p>
                    <p className="font-medium">{booklet.used_indents} / {booklet.total_indents}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-medium">{booklet.total_indents - booklet.used_indents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Indents</CardTitle>
              <CardDescription>
                All indents issued from this booklet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indents.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No indents have been used from this booklet yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indent #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Fuel</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indents.map((indent) => (
                      <TableRow key={indent.id}>
                        <TableCell className="font-medium">{indent.indent_number}</TableCell>
                        <TableCell>{new Date(indent.date).toLocaleDateString()}</TableCell>
                        <TableCell>{indent.vehicle_number}</TableCell>
                        <TableCell>{indent.fuel_type}</TableCell>
                        <TableCell>{indent.quantity} L</TableCell>
                        <TableCell>₹{indent.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            indent.transaction ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {indent.transaction ? 'Fulfilled' : 'Pending'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BookletIndents;
