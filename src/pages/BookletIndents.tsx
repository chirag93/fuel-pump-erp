
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase, Indent, IndentBooklet, Transaction } from '@/integrations/supabase/client';

interface IndentWithTransaction extends Indent {
  transaction?: Transaction;
  vehicle_number?: string;
}

const BookletIndents = () => {
  const { customerId, bookletId } = useParams<{ customerId: string; bookletId: string }>();
  const [indents, setIndents] = useState<IndentWithTransaction[]>([]);
  const [booklet, setBooklet] = useState<IndentBooklet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooklet = async () => {
      if (!bookletId) return;
      
      try {
        const { data, error } = await supabase
          .from('indent_booklets')
          .select('*')
          .eq('id', bookletId)
          .single();

        if (error) throw error;
        
        if (data) {
          setBooklet(data as IndentBooklet);
        }
      } catch (error) {
        console.error('Error fetching booklet:', error);
        toast({
          title: "Error",
          description: "Failed to load booklet details",
          variant: "destructive"
        });
      }
    };

    const fetchIndents = async () => {
      if (!bookletId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch indents for this booklet
        const { data: indentsData, error: indentsError } = await supabase
          .from('indents')
          .select(`
            *,
            vehicles(number)
          `)
          .eq('booklet_id', bookletId)
          .order('created_at', { ascending: false });

        if (indentsError) throw indentsError;
        
        // If we have indents, fetch their related transactions
        if (indentsData && indentsData.length > 0) {
          const indentIds = indentsData.map(indent => indent.id);
          
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .in('indent_id', indentIds);
            
          if (transactionsError) throw transactionsError;
          
          // Map transactions to indents
          const indentsWithTransactions = indentsData.map(indent => {
            const transaction = transactionsData?.find(t => t.indent_id === indent.id);
            return {
              ...indent,
              transaction: transaction,
              vehicle_number: indent.vehicles?.number
            };
          });
          
          setIndents(indentsWithTransactions as IndentWithTransaction[]);
        } else {
          setIndents([]);
        }
      } catch (error) {
        console.error('Error fetching indents:', error);
        toast({
          title: "Error",
          description: "Failed to load indent information",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooklet();
    fetchIndents();
  }, [bookletId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading booklet indents...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Link to={`/customers/${customerId}`} className="mr-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customer
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Booklet Indents</h1>
      </div>
      
      {booklet && (
        <Card>
          <CardHeader>
            <CardTitle>Booklet {booklet.start_number} - {booklet.end_number}</CardTitle>
            <CardDescription>
              Issued on {new Date(booklet.issued_date).toLocaleDateString()} • 
              {booklet.used_indents} of {booklet.total_indents} indents used • 
              Status: <span className={`px-2 py-1 text-xs rounded-full ${
                booklet.status === 'Completed' 
                  ? 'bg-green-100 text-green-800' 
                  : booklet.status === 'Active' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-red-100 text-red-800'
              }`}>{booklet.status}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {indents.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No indents have been created for this booklet yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indent Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indents.map((indent) => (
                    <TableRow key={indent.id}>
                      <TableCell className="font-medium">{indent.indent_number}</TableCell>
                      <TableCell>{new Date(indent.date).toLocaleDateString()}</TableCell>
                      <TableCell>{indent.vehicle_number || 'Unknown'}</TableCell>
                      <TableCell>{indent.fuel_type}</TableCell>
                      <TableCell>{indent.quantity} L</TableCell>
                      <TableCell>₹{indent.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          indent.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : indent.status === 'Pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {indent.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {indent.transaction ? (
                          <div className="text-xs">
                            <span className="font-semibold">ID:</span> {indent.transaction.id.substring(0, 8)}...<br/>
                            <span className="font-semibold">Date:</span> {new Date(indent.transaction.date).toLocaleDateString()}<br/>
                            <span className="font-semibold">Method:</span> {indent.transaction.payment_method}
                          </div>
                        ) : (
                          <div className="flex items-center text-yellow-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            No transaction
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookletIndents;
