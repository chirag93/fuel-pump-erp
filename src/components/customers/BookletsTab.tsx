
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IndentBookletDialog } from './IndentBookletDialog';
import { useState } from 'react';
import { IndentBooklet } from '@/integrations/supabase/client';
import { Book, Plus, FileText, Eye, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';

interface BookletsTabProps {
  indentBooklets: IndentBooklet[];
  customerId: string;
  customerName: string;
  setIndentBooklets: React.Dispatch<React.SetStateAction<IndentBooklet[]>>;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const BookletsTab = ({ 
  indentBooklets, 
  customerId, 
  customerName, 
  setIndentBooklets,
  isLoading = false,
  onRefresh 
}: BookletsTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleNewBooklet = (newBooklet: IndentBooklet) => {
    setIndentBooklets(prev => [...prev, newBooklet]);
  };
  
  const getStatusBadgeColor = (status: string, usedIndents: number) => {
    if (status === 'Completed') return 'bg-green-100 text-green-800';
    if (status === 'Cancelled') return 'bg-red-100 text-red-800';
    if (status === 'Active' && usedIndents > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  const getStatusLabel = (status: string, usedIndents: number) => {
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled') return 'Cancelled';
    if (status === 'Active' && usedIndents > 0) return 'In Progress';
    return 'Unused';
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle>Indent Booklets</CardTitle>
              <CardDescription>Manage indent booklets for {customerName}</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Issue New Booklet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading booklets...</span>
            </div>
          ) : indentBooklets && indentBooklets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booklet Numbers</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Total Indents</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indentBooklets.map((booklet) => (
                  <TableRow key={booklet.id}>
                    <TableCell className="font-medium">{booklet.start_number} - {booklet.end_number}</TableCell>
                    <TableCell>{format(new Date(booklet.issued_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{booklet.total_indents}</TableCell>
                    <TableCell>{booklet.used_indents}</TableCell>
                    <TableCell>
                      <Badge 
                        className={getStatusBadgeColor(booklet.status, booklet.used_indents)}
                        variant="outline"
                      >
                        {getStatusLabel(booklet.status, booklet.used_indents)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/customers/${customerId}/booklets/${booklet.id}/indents`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Indents
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Book className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Booklets Found</h3>
              <p className="text-muted-foreground mb-4">
                This customer does not have any indent booklets yet.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                Issue First Booklet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <IndentBookletDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        customerId={customerId}
        customerName={customerName}
        onSuccess={handleNewBooklet}
      />
    </div>
  );
};

export default BookletsTab;
