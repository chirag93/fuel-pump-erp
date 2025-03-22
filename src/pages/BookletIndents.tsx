
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArrowLeft, FileText, AlertCircle, Edit, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase, Indent, IndentBooklet, Transaction } from '@/integrations/supabase/client';
import { IndentEditDialog } from '@/components/indent/IndentEditDialog';

interface IndentWithTransaction extends Indent {
  transaction?: Transaction;
  vehicle_number?: string;
}

const BookletIndents = () => {
  const { customerId, bookletId } = useParams<{ customerId: string; bookletId: string }>();
  const [indents, setIndents] = useState<IndentWithTransaction[]>([]);
  const [booklet, setBooklet] = useState<IndentBooklet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingIndent, setEditingIndent] = useState<IndentWithTransaction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unusedIndentNumbers, setUnusedIndentNumbers] = useState<string[]>([]);
  const [showUnusedIndents, setShowUnusedIndents] = useState(false);
  
  const PAGE_SIZE = 10;

  // Get all indent numbers that should exist in this booklet
  const generateAllIndentNumbers = (booklet: IndentBooklet) => {
    if (!booklet) return [];
    
    const start = parseInt(booklet.start_number);
    const end = parseInt(booklet.end_number);
    const allNumbers: string[] = [];
    
    for (let i = start; i <= end; i++) {
      allNumbers.push(i.toString());
    }
    
    return allNumbers;
  };

  // Find unused indent numbers by comparing all possible numbers with used ones
  const findUnusedIndentNumbers = (booklet: IndentBooklet, usedIndents: Indent[]) => {
    if (!booklet) return [];
    
    const allNumbers = generateAllIndentNumbers(booklet);
    const usedNumbers = usedIndents.map(indent => indent.indent_number);
    
    // Filter out used numbers to get unused ones
    return allNumbers.filter(num => !usedNumbers.includes(num));
  };

  const fetchData = async () => {
    if (!bookletId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch booklet details
      const { data: bookletData, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('id', bookletId)
        .single();

      if (bookletError) throw bookletError;
      
      if (bookletData) {
        setBooklet(bookletData as IndentBooklet);
      }
      
      // Calculate pagination range
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      // Fetch indents for this booklet with pagination
      const { data: indentsData, error: indentsError, count } = await supabase
        .from('indents')
        .select(`
          *,
          vehicles(number)
        `, { count: 'exact' })
        .eq('booklet_id', bookletId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (indentsError) throw indentsError;
      
      // Update pagination info
      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / PAGE_SIZE));
      }
      
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
            vehicle_number: indent.vehicles?.number,
            status: indent.status || 'Pending'  // Default to 'Pending' if status is null
          };
        });
        
        setIndents(indentsWithTransactions as IndentWithTransaction[]);
        
        // Now get all indents for this booklet (not just the paginated ones)
        // to calculate the unused indent numbers
        const { data: allIndentsData } = await supabase
          .from('indents')
          .select('indent_number')
          .eq('booklet_id', bookletId);
        
        if (allIndentsData && bookletData) {
          const unused = findUnusedIndentNumbers(bookletData, allIndentsData);
          setUnusedIndentNumbers(unused);
        }
      } else {
        setIndents([]);
        
        // If no indents at all, all numbers in the range are unused
        if (bookletData) {
          const unused = findUnusedIndentNumbers(bookletData, []);
          setUnusedIndentNumbers(unused);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load indent information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bookletId, currentPage]);

  const handleEditIndent = (indent: IndentWithTransaction) => {
    setEditingIndent(indent);
    setShowEditDialog(true);
  };

  const handleIndentUpdated = async () => {
    setShowEditDialog(false);
    setEditingIndent(null);
    await fetchData(); // Refresh data after update
    toast({
      title: "Success",
      description: "Indent has been updated"
    });
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const navigateToCreateIndent = () => {
    // Navigate to the create indent page with the customer ID and booklet ID
    window.location.href = `/record-indent?customerId=${customerId}&bookletId=${bookletId}`;
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1} 
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last as they're always shown
      
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i} 
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages} 
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

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
            <div className="flex justify-between items-center">
              <div>
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
              </div>
              
              <Button onClick={() => navigateToCreateIndent()} className="gap-1">
                <Plus size={16} />
                New Indent
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {unusedIndentNumbers.length} unused indent numbers available
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowUnusedIndents(!showUnusedIndents)}
              >
                {showUnusedIndents ? "Hide Unused Indents" : "Show Unused Indents"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showUnusedIndents && unusedIndentNumbers.length > 0 && (
              <div className="mb-6 p-4 border rounded-md bg-slate-50">
                <h3 className="text-sm font-medium mb-2">Unused Indent Numbers</h3>
                <div className="flex flex-wrap gap-2">
                  {unusedIndentNumbers.map(number => (
                    <span 
                      key={number} 
                      className="inline-block px-2 py-1 text-xs bg-slate-100 rounded-md"
                      title="Click to create new indent with this number"
                      onClick={() => window.location.href = `/record-indent?customerId=${customerId}&bookletId=${bookletId}&indentNumber=${number}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {indents.length === 0 && !showUnusedIndents ? (
              <div className="py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No indents have been created for this booklet yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigateToCreateIndent()}
                >
                  Create First Indent
                </Button>
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
                    <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditIndent(indent)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          
          {totalPages > 1 && (
            <CardFooter className="flex justify-center pt-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <p className="text-sm text-center text-muted-foreground mt-2">
                Showing {indents.length} of {totalCount} indents
              </p>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Edit Dialog */}
      {editingIndent && (
        <IndentEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          indent={editingIndent}
          onUpdate={handleIndentUpdated}
        />
      )}
    </div>
  );
};

export default BookletIndents;
