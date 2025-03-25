
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Transaction {
  id: string;
  customer_id: string;
  customer_name?: string;
  vehicle_id: string;
  vehicle_number?: string;
  date: string;
  fuel_type: string;
  amount: number;
  quantity: number;
  payment_method: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  source: string;
  staff_id: string;
  staff_name?: string;
}

interface Indent {
  id: string;
  customer_id: string;
  customer_name?: string;
  vehicle_id: string;
  vehicle_number?: string;
  date: string;
  fuel_type: string;
  amount: number;
  quantity: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  source: string;
  indent_number: string;
  booklet_id: string;
}

const ApprovalRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('transactions');
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [pendingIndents, setPendingIndents] = useState<Indent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<Transaction | Indent | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState<boolean>(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject'>('approve');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  useEffect(() => {
    fetchPendingItems();
  }, [activeTab]);
  
  const fetchPendingItems = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === 'transactions' || activeTab === 'all') {
        // Fetch pending transactions with customer and vehicle details
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            *,
            customers:customer_id (name),
            vehicles:vehicle_id (number),
            staff:staff_id (name)
          `)
          .eq('approval_status', 'pending');
        
        if (transactionError) throw transactionError;
        
        if (transactionData) {
          const formattedTransactions = transactionData.map((item: any) => ({
            ...item,
            customer_name: item.customers?.name,
            vehicle_number: item.vehicles?.number,
            staff_name: item.staff?.name
          }));
          
          setPendingTransactions(formattedTransactions);
        }
      }
      
      if (activeTab === 'indents' || activeTab === 'all') {
        // Fetch pending indents with customer and vehicle details
        const { data: indentData, error: indentError } = await supabase
          .from('indents')
          .select(`
            *,
            customers:customer_id (name),
            vehicles:vehicle_id (number)
          `)
          .eq('approval_status', 'pending');
        
        if (indentError) throw indentError;
        
        if (indentData) {
          const formattedIndents = indentData.map((item: any) => ({
            ...item,
            customer_name: item.customers?.name,
            vehicle_number: item.vehicles?.number
          }));
          
          setPendingIndents(formattedIndents);
        }
      }
    } catch (error) {
      console.error('Error fetching pending items:', error);
      toast({
        title: "Error",
        description: "Failed to load pending approval requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApprove = (item: Transaction | Indent) => {
    setSelectedItem(item);
    setApprovalNotes('');
    setCurrentAction('approve');
    setApprovalDialogOpen(true);
  };
  
  const handleReject = (item: Transaction | Indent) => {
    setSelectedItem(item);
    setApprovalNotes('');
    setCurrentAction('reject');
    setRejectionDialogOpen(true);
  };
  
  const processApproval = async () => {
    if (!selectedItem || !user) return;
    
    setIsProcessing(true);
    
    try {
      const status = currentAction === 'approve' ? 'approved' : 'rejected';
      const tableName = isIndentItem(selectedItem) ? 'indents' : 'transactions';
      
      // Update the item's approval status
      const { error } = await supabase
        .from(tableName)
        .update({
          approval_status: status,
          approval_notes: approvalNotes,
          approval_date: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      toast({
        title: currentAction === 'approve' ? "Approved" : "Rejected",
        description: `The ${tableName.slice(0, -1)} has been ${status} successfully.`,
        variant: currentAction === 'approve' ? "default" : "destructive"
      });
      
      // Close dialogs
      setApprovalDialogOpen(false);
      setRejectionDialogOpen(false);
      
      // Refresh the data
      fetchPendingItems();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: `Failed to ${currentAction} the item. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Fixed function to safely check if an item is an Indent
  const isIndentItem = (item: any): item is Indent => {
    if (!item) return false;
    return 'indent_number' in item;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Requests</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage pending approval requests for transactions and indents.
        </p>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="indents">Indents</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Transaction Approvals</CardTitle>
              <CardDescription>
                Review and approve transactions recorded via mobile app or other sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTransactionsTable()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="indents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Indent Approvals</CardTitle>
              <CardDescription>
                Review and approve indents recorded via mobile app or other sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderIndentsTable()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Pending Approvals</CardTitle>
              <CardDescription>
                Combined view of all pending approvals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="font-medium mb-2">Transactions</h3>
              {renderTransactionsTable()}
              
              <h3 className="font-medium mt-6 mb-2">Indents</h3>
              {renderIndentsTable()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Approval Confirmation Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedItem ? (isIndentItem(selectedItem) ? 'Indent' : 'Transaction') : ''}</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this {selectedItem ? (isIndentItem(selectedItem) ? 'indent' : 'transaction') : 'item'}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approvalNotes">Notes (Optional)</Label>
              <Textarea
                id="approvalNotes"
                placeholder="Add any notes about this approval"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
            <Button onClick={processApproval} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rejection Confirmation Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedItem ? (isIndentItem(selectedItem) ? 'Indent' : 'Transaction') : ''}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {selectedItem ? (isIndentItem(selectedItem) ? 'indent' : 'transaction') : 'item'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionNotes">Reason for Rejection</Label>
              <Textarea
                id="rejectionNotes"
                placeholder="Enter the reason for rejection"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={processApproval} disabled={isProcessing || !approvalNotes.trim()} variant="destructive">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  function renderTransactionsTable() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (pendingTransactions.length === 0) {
      return (
        <div className="py-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No pending transactions found</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Fuel Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.id.substring(0, 8)}...</TableCell>
                <TableCell>{transaction.customer_name || 'Unknown'}</TableCell>
                <TableCell>{transaction.vehicle_number || 'Unknown'}</TableCell>
                <TableCell>{transaction.staff_name || 'Unknown'}</TableCell>
                <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{transaction.fuel_type}</TableCell>
                <TableCell>₹{transaction.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.source}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={() => handleApprove(transaction)} 
                      size="sm" 
                      variant="outline"
                      className="h-8 gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleReject(transaction)} 
                      size="sm" 
                      variant="outline"
                      className="h-8 gap-1"
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  function renderIndentsTable() {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (pendingIndents.length === 0) {
      return (
        <div className="py-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No pending indents found</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Indent #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Fuel Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingIndents.map((indent) => (
              <TableRow key={indent.id}>
                <TableCell className="font-medium">{indent.indent_number}</TableCell>
                <TableCell>{indent.customer_name || 'Unknown'}</TableCell>
                <TableCell>{indent.vehicle_number || 'Unknown'}</TableCell>
                <TableCell>{format(new Date(indent.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{indent.fuel_type}</TableCell>
                <TableCell>₹{indent.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{indent.source}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={() => handleApprove(indent)} 
                      size="sm" 
                      variant="outline"
                      className="h-8 gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleReject(indent)} 
                      size="sm" 
                      variant="outline"
                      className="h-8 gap-1"
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
};

// Create a dedicated wrapper component that applies the DashboardLayout
// This ensures we only have one instance of DashboardLayout
const ApprovalRequestsPage = () => (
  <DashboardLayout>
    <ApprovalRequests />
  </DashboardLayout>
);

export default ApprovalRequestsPage;
