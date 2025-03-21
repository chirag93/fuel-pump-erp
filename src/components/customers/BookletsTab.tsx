import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Book, Edit, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { IndentBooklet } from '@/integrations/supabase/client';
import { createIndentBooklet } from '@/integrations/indentBooklets';
import { Link } from 'react-router-dom';

interface NewBookletData {
  start_number: string;
  end_number: string;
  customer_id: string;
  issued_date: string;
}

interface BookletsTabProps {
  indentBooklets: IndentBooklet[];
  setIndentBooklets: React.Dispatch<React.SetStateAction<IndentBooklet[]>>;
  customerId: string;
  customerName: string;
}

const BookletsTab = ({ indentBooklets, setIndentBooklets, customerId, customerName }: BookletsTabProps) => {
  const [bookletDialogOpen, setBookletDialogOpen] = useState(false);
  const [newBooklet, setNewBooklet] = useState<Partial<NewBookletData>>({
    customer_id: customerId,
    start_number: '',
    end_number: '',
    issued_date: new Date().toISOString().split('T')[0]
  });

  const handleAddBooklet = async () => {
    try {
      if (!newBooklet.start_number || !newBooklet.end_number || !newBooklet.issued_date) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }

      const startNum = parseInt(newBooklet.start_number);
      const endNum = parseInt(newBooklet.end_number);

      if (isNaN(startNum) || isNaN(endNum) || startNum >= endNum) {
        toast({
          title: "Invalid range",
          description: "End number must be greater than start number",
          variant: "destructive"
        });
        return;
      }

      const totalIndents = endNum - startNum + 1;

      const bookletData = {
        customer_id: customerId,
        start_number: newBooklet.start_number,
        end_number: newBooklet.end_number,
        issued_date: newBooklet.issued_date,
        total_indents: totalIndents,
        used_indents: 0,
        status: 'Active' as 'Active' | 'Completed' | 'Cancelled'
      };
      
      const result = await createIndentBooklet(bookletData);
      
      if (result) {
        setIndentBooklets([...indentBooklets, result]);
        setBookletDialogOpen(false);
        setNewBooklet({
          customer_id: customerId,
          start_number: '',
          end_number: '',
          issued_date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error adding indent booklet:', error);
    }
  };

  const getDisplayStatus = (booklet: IndentBooklet): string => {
    if (booklet.status === 'Completed') return 'Completed';
    if (booklet.status === 'Active' && booklet.used_indents > 0) return 'In Progress';
    if (booklet.status === 'Active' && booklet.used_indents === 0) return 'Unused';
    return booklet.status;
  }

  const getStatusClassNames = (booklet: IndentBooklet): string => {
    if (booklet.status === 'Completed') return 'bg-green-100 text-green-800';
    if (booklet.status === 'Active' && booklet.used_indents > 0) return 'bg-blue-100 text-blue-800';
    if (booklet.status === 'Active' && booklet.used_indents === 0) return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800'; // Cancelled or other statuses
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Indent Booklets</CardTitle>
          <Dialog open={bookletDialogOpen} onOpenChange={setBookletDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Book className="h-4 w-4" />
                Issue Booklet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue New Indent Booklet</DialogTitle>
                <DialogDescription>
                  Issue a new indent booklet to this customer
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="issued_date">Issue Date</Label>
                  <Input 
                    id="issued_date" 
                    type="date"
                    value={newBooklet.issued_date}
                    onChange={e => setNewBooklet({...newBooklet, issued_date: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_number">Start Number</Label>
                    <Input 
                      id="start_number" 
                      placeholder="e.g. 1001"
                      value={newBooklet.start_number}
                      onChange={e => setNewBooklet({...newBooklet, start_number: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_number">End Number</Label>
                    <Input 
                      id="end_number" 
                      placeholder="e.g. 1100"
                      value={newBooklet.end_number}
                      onChange={e => setNewBooklet({...newBooklet, end_number: e.target.value})}
                    />
                  </div>
                </div>
                {newBooklet.start_number && newBooklet.end_number && !isNaN(parseInt(newBooklet.start_number)) && !isNaN(parseInt(newBooklet.end_number)) && (
                  <div className="text-sm text-muted-foreground">
                    This booklet will contain {Math.max(0, parseInt(newBooklet.end_number) - parseInt(newBooklet.start_number) + 1)} indent slips.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBookletDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddBooklet}>Issue Booklet</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {indentBooklets.length === 0 ? (
          <div className="py-8 text-center">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No indent booklets issued yet</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setBookletDialogOpen(true)}
            >
              Issue First Booklet
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Range</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indentBooklets.map((booklet) => (
                <TableRow key={booklet.id}>
                  <TableCell className="font-medium">{booklet.start_number} - {booklet.end_number}</TableCell>
                  <TableCell>{new Date(booklet.issued_date).toLocaleDateString()}</TableCell>
                  <TableCell>{booklet.used_indents} / {booklet.total_indents}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusClassNames(booklet)}`}>
                      {getDisplayStatus(booklet)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Link to={`/customers/${customerId}/booklets/${booklet.id}/indents`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          View Indents
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default BookletsTab;
