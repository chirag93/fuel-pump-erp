
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ChevronLeft, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Indent {
  id: string;
  customer_id: string;
  booklet_id: string;
  indent_number: string;
  date: string; // Changed from issue_date to date
  vehicle_id: string;
  vehicle_number?: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

const BookletIndents = () => {
  const { bookletId, customerId } = useParams<{ bookletId: string, customerId: string }>();
  const [loading, setLoading] = useState(true);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [booklet, setBooklet] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching data for booklet ID:', bookletId);
        
        // Fetch the booklet
        if (bookletId) {
          const { data: bookletData, error: bookletError } = await supabase
            .from('indent_booklets')
            .select('*')
            .eq('id', bookletId)
            .single();
            
          if (bookletError) throw bookletError;
          setBooklet(bookletData);
          
          // Fetch the customer
          if (customerId) {
            const { data: customerData, error: customerError } = await supabase
              .from('customers')
              .select('*')
              .eq('id', customerId)
              .single();
              
            if (customerError) throw customerError;
            setCustomer(customerData);
          }
          
          // Fetch the indents for this booklet
          const { data: indentsData, error: indentsError } = await supabase
            .from('indents')
            .select(`
              *,
              vehicles (number)
            `)
            .eq('booklet_id', bookletId)
            .order('date', { ascending: false }); // Changed from issue_date to date
            
          if (indentsError) throw indentsError;
          
          // Transform the data to include vehicle number
          const transformedIndents = indentsData.map((indent: any) => ({
            ...indent,
            vehicle_number: indent.vehicles?.number
          }));
          
          setIndents(transformedIndents);
        }
      } catch (error) {
        console.error('Error fetching booklet data:', error);
        toast({
          title: "Error",
          description: "Failed to load indent data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bookletId, customerId]);
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  
  const exportIndents = () => {
    if (!indents.length || !customer) return;
    
    // Define CSV headers
    const headers = [
      'Indent Number',
      'Date',
      'Vehicle',
      'Fuel Type',
      'Quantity',
      'Amount',
      'Status'
    ];
    
    // Convert indents to CSV rows
    const rows = indents.map(indent => {
      return [
        indent.indent_number,
        format(new Date(indent.date), 'dd/MM/yyyy'), // Changed from issue_date to date
        indent.vehicle_number || 'N/A',
        indent.fuel_type,
        indent.quantity,
        indent.amount,
        indent.status
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `booklet_indents_${bookletId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading indent data...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link to={`/customers/${customerId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Customer
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Booklet Indents</h1>
            </div>
            
            {indents.length > 0 && (
              <Button variant="outline" onClick={exportIndents} className="flex items-center gap-2">
                <Download size={16} />
                Export CSV
              </Button>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Booklet Details</CardTitle>
              <CardDescription>
                Viewing indents for booklet {booklet?.start_number} - {booklet?.end_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-lg">{customer?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Booklet Range</p>
                  <p className="text-lg">{booklet?.start_number} - {booklet?.end_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Usage</p>
                  <p className="text-lg">{booklet?.used_indents} of {booklet?.total_indents} indents used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Indent List</CardTitle>
              <CardDescription>
                All indents issued from this booklet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Indents Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No indents have been issued from this booklet yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indent #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indents.map((indent) => (
                        <TableRow key={indent.id}>
                          <TableCell className="font-medium">{indent.indent_number}</TableCell>
                          <TableCell>{format(new Date(indent.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{indent.vehicle_number || 'N/A'}</TableCell>
                          <TableCell>{indent.fuel_type}</TableCell>
                          <TableCell>{indent.quantity} L</TableCell>
                          <TableCell>₹{indent.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(indent.status)}`}>
                              {indent.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BookletIndents;
