
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Book, Edit, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase, IndentBooklet } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
}

const BookletsTab = ({ indentBooklets, setIndentBooklets, customerId }: BookletsTabProps) => {
  const navigate = useNavigate();
  const [bookletDialogOpen, setBookletDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooklet, setSelectedBooklet] = useState<IndentBooklet | null>(null);
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

      const { data, error } = await supabase
        .from('indent_booklets')
        .insert([{
          customer_id: customerId,
          start_number: newBooklet.start_number,
          end_number: newBooklet.end_number,
          issued_date: newBooklet.issued_date,
          total_indents: totalIndents,
          used_indents: 0,
          status: 'Active'
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        // Transform to ensure status is of the correct type
        const booklet: IndentBooklet = {
          ...data[0],
          status: data[0].status as 'Active' | 'Completed' | 'Cancelled'
        };
        
        setIndentBooklets([...indentBooklets, booklet]);
        setBookletDialogOpen(false);
        setNewBooklet({
          customer_id: customerId,
          start_number: '',
          end_number: '',
          issued_date: new Date().toISOString().split('T')[0]
        });
        
        toast({
          title: "Success",
          description: "Indent booklet issued successfully"
        });
      }
    } catch (error) {
      console.error('Error adding indent booklet:', error);
      toast({
        title: "Error",
        description: "Failed to issue indent booklet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditBooklet = (booklet: IndentBooklet) => {
    setSelectedBooklet(booklet);
    setEditDialogOpen(true);
  };

  const saveBookletChanges = async () => {
    if (!selectedBooklet) return;

    try {
      const { error } = await supabase
        .from('indent_booklets')
        .update({
          status: selectedBooklet.status
        })
        .eq('id', selectedBooklet.id);

      if (error) throw error;

      // Update the local state with the edited booklet
      const updatedBooklets = indentBooklets.map(booklet => 
        booklet.id === selectedBooklet.id ? selectedBooklet : booklet
      );
      
      setIndentBooklets(updatedBooklets);
      setEditDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Booklet updated successfully"
      });
    } catch (error) {
      console.error('Error updating booklet:', error);
      toast({
        title: "Error",
        description: "Failed to update booklet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewIndents = (bookletId: string) => {
    navigate(`/customer/${customerId}/booklet/${bookletId}/indents`);
  };

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
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booklet.status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : booklet.status === 'Active' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booklet.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditBooklet(booklet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewIndents(booklet.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Booklet Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Booklet</DialogTitle>
              <DialogDescription>
                Update the status of this indent booklet
              </DialogDescription>
            </DialogHeader>
            {selectedBooklet && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="booklet_range">Booklet Range</Label>
                  <Input 
                    id="booklet_range" 
                    value={`${selectedBooklet.start_number} - ${selectedBooklet.end_number}`}
                    readOnly
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="booklet_status">Status</Label>
                  <select
                    id="booklet_status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedBooklet.status}
                    onChange={(e) => setSelectedBooklet({
                      ...selectedBooklet,
                      status: e.target.value as 'Active' | 'Completed' | 'Cancelled'
                    })}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveBookletChanges}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BookletsTab;
