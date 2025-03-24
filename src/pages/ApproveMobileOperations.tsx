
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase, Transaction, Indent } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, XCircle, AlertCircle, 
  FileText, Calendar, Filter, Loader2, Clock 
} from 'lucide-react';

type ApprovalType = 'transaction' | 'indent';

interface PendingApprovalItem {
  id: string;
  type: ApprovalType;
  date: string;
  customer_name?: string;
  vehicle_number?: string;
  fuel_type: string;
  amount: number;
  quantity: number;
  staff_name?: string;
  created_at: string;
  indent_number?: string;
  booklet_id?: string;
}

const ApproveMobileOperations = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
  const [filteredApprovals, setFilteredApprovals] = useState<PendingApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Approval dialog states
  const [selectedItem, setSelectedItem] = useState<PendingApprovalItem | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Load pending approvals
  useEffect(() => {
    fetchApprovals();
  }, [currentTab]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      // Fetch pending transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          fuel_type,
          amount,
          quantity,
          source,
          approval_status,
          created_at,
          indent_id,
          staff_id,
          customers:customer_id (name),
          vehicles:vehicle_id (number)
        `)
        .eq('source', 'mobile')
        .eq('approval_status', currentTab);

      if (transError) throw transError;

      // Fetch pending indents
      const { data: indents, error: indentError } = await supabase
        .from('indents')
        .select(`
          id,
          date,
          fuel_type,
          amount, 
          quantity,
          source,
          approval_status,
          created_at,
          indent_number,
          booklet_id,
          customers:customer_id (name),
          vehicles:vehicle_id (number)
        `)
        .eq('source', 'mobile')
        .eq('approval_status', currentTab);

      if (indentError) throw indentError;

      // Fetch staff information
      const staffIds = transactions?.map(t => t.staff_id) || [];
      
      let staffMap: Record<string, string> = {};
      
      if (staffIds.length > 0) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, name')
          .in('id', staffIds);
          
        if (staffData) {
          staffMap = staffData.reduce((acc, staff) => {
            acc[staff.id] = staff.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Combine and format data
      const formattedTransactions: PendingApprovalItem[] = (transactions || []).map(t => ({
        id: t.id,
        type: 'transaction',
        date: t.date,
        customer_name: t.customers?.name,
        vehicle_number: t.vehicles?.number,
        fuel_type: t.fuel_type,
        amount: t.amount,
        quantity: t.quantity,
        staff_name: staffMap[t.staff_id] || 'Unknown Staff',
        created_at: t.created_at || '',
        indent_number: t.indent_id
      }));

      const formattedIndents: PendingApprovalItem[] = (indents || []).map(i => ({
        id: i.id,
        type: 'indent',
        date: i.date,
        customer_name: i.customers?.name,
        vehicle_number: i.vehicles?.number,
        fuel_type: i.fuel_type,
        amount: i.amount,
        quantity: i.quantity,
        created_at: i.created_at || '',
        indent_number: i.indent_number,
        booklet_id: i.booklet_id
      }));

      const combined = [...formattedTransactions, ...formattedIndents].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPendingApprovals(combined);
      setFilteredApprovals(combined);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast({
        title: "Error",
        description: "Failed to load pending approvals",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter handlers
  useEffect(() => {
    let filtered = pendingApprovals;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.customer_name?.toLowerCase().includes(term)) ||
        (item.vehicle_number?.toLowerCase().includes(term)) ||
        (item.fuel_type.toLowerCase().includes(term)) ||
        (item.indent_number?.toLowerCase().includes(term))
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === today.getTime();
        });
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= weekAgo;
        });
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= monthAgo;
        });
      }
    }

    setFilteredApprovals(filtered);
  }, [searchTerm, dateFilter, pendingApprovals]);

  // Handle approve action
  const handleApprove = async () => {
    if (!selectedItem) return;
    
    setIsProcessing(true);
    try {
      const currentDate = new Date().toISOString();
      
      if (selectedItem.type === 'transaction') {
        const { error } = await supabase
          .from('transactions')
          .update({
            approval_status: 'approved',
            approved_by: 'manager', // Ideally this would be the current user's ID
            approval_date: currentDate,
            approval_notes: approvalNotes
          })
          .eq('id', selectedItem.id);
          
        if (error) throw error;
      } else if (selectedItem.type === 'indent') {
        const { error } = await supabase
          .from('indents')
          .update({
            approval_status: 'approved',
            approved_by: 'manager', // Ideally this would be the current user's ID
            approval_date: currentDate,
            approval_notes: approvalNotes
          })
          .eq('id', selectedItem.id);
          
        if (error) throw error;
      }
      
      toast({
        title: "Approved",
        description: `Successfully approved the ${selectedItem.type}`,
      });
      
      setShowApproveDialog(false);
      setApprovalNotes('');
      fetchApprovals();
    } catch (error) {
      console.error('Error approving item:', error);
      toast({
        title: "Error",
        description: `Failed to approve the ${selectedItem.type}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!selectedItem) return;
    
    setIsProcessing(true);
    try {
      const currentDate = new Date().toISOString();
      
      if (selectedItem.type === 'transaction') {
        const { error } = await supabase
          .from('transactions')
          .update({
            approval_status: 'rejected',
            approved_by: 'manager', // Ideally this would be the current user's ID
            approval_date: currentDate,
            approval_notes: approvalNotes
          })
          .eq('id', selectedItem.id);
          
        if (error) throw error;
      } else if (selectedItem.type === 'indent') {
        const { error } = await supabase
          .from('indents')
          .update({
            approval_status: 'rejected',
            approved_by: 'manager', // Ideally this would be the current user's ID
            approval_date: currentDate,
            approval_notes: approvalNotes
          })
          .eq('id', selectedItem.id);
          
        if (error) throw error;
      }
      
      toast({
        title: "Rejected",
        description: `Successfully rejected the ${selectedItem.type}`,
      });
      
      setShowRejectDialog(false);
      setApprovalNotes('');
      fetchApprovals();
    } catch (error) {
      console.error('Error rejecting item:', error);
      toast({
        title: "Error",
        description: `Failed to reject the ${selectedItem.type}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Format date and time for details
  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMM yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mobile Operations Approval</h1>
      </div>

      <Tabs 
        defaultValue="pending" 
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value as 'pending' | 'approved' | 'rejected')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Approved</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="relative w-full sm:w-64">
                  <Input 
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  <div className="absolute left-2 top-2.5 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
                
                <Select
                  value={dateFilter}
                  onValueChange={setDateFilter}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Time Range</SelectLabel>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No pending approvals found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApprovals.map((item) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            {item.type === 'transaction' ? 'Transaction' : 'Indent'}
                            {item.indent_number && <div className="text-xs text-muted-foreground">
                              #{item.indent_number}
                            </div>}
                          </TableCell>
                          <TableCell>{item.customer_name || 'N/A'}</TableCell>
                          <TableCell>{item.vehicle_number || 'N/A'}</TableCell>
                          <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Details</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-500 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowApproveDialog(true);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                                <span className="sr-only">Reject</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Similar content to pending tab, but for approved items */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                {/* Same filtering options */}
                <div className="relative w-full sm:w-64">
                  <Input 
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  <div className="absolute left-2 top-2.5 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
                
                <Select
                  value={dateFilter}
                  onValueChange={setDateFilter}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Time Range</SelectLabel>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No approved items found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApprovals.map((item) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            {item.type === 'transaction' ? 'Transaction' : 'Indent'}
                            {item.indent_number && <div className="text-xs text-muted-foreground">
                              #{item.indent_number}
                            </div>}
                          </TableCell>
                          <TableCell>{item.customer_name || 'N/A'}</TableCell>
                          <TableCell>{item.vehicle_number || 'N/A'}</TableCell>
                          <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowDetailDialog(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-4 space-y-4">
          {/* Similar content to other tabs, but for rejected items */}
          <Card>
            <CardHeader>
              <CardTitle>Rejected Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="relative w-full sm:w-64">
                  <Input 
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  <div className="absolute left-2 top-2.5 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
                
                <Select
                  value={dateFilter}
                  onValueChange={setDateFilter}
                >
                  <SelectTrigger className="w-full sm:w-36">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Time Range</SelectLabel>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No rejected items found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApprovals.map((item) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            {item.type === 'transaction' ? 'Transaction' : 'Indent'}
                            {item.indent_number && <div className="text-xs text-muted-foreground">
                              #{item.indent_number}
                            </div>}
                          </TableCell>
                          <TableCell>{item.customer_name || 'N/A'}</TableCell>
                          <TableCell>{item.vehicle_number || 'N/A'}</TableCell>
                          <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowDetailDialog(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedItem?.type}</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this {selectedItem?.type}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-3">
              {selectedItem && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Customer:</div>
                    <div className="text-sm">{selectedItem.customer_name || 'N/A'}</div>
                    
                    <div className="text-sm font-medium">Vehicle:</div>
                    <div className="text-sm">{selectedItem.vehicle_number || 'N/A'}</div>
                    
                    <div className="text-sm font-medium">Fuel Type:</div>
                    <div className="text-sm">{selectedItem.fuel_type}</div>
                    
                    <div className="text-sm font-medium">Amount:</div>
                    <div className="text-sm">₹{selectedItem.amount.toFixed(2)}</div>
                    
                    <div className="text-sm font-medium">Quantity:</div>
                    <div className="text-sm">{selectedItem.quantity.toFixed(2)} L</div>
                    
                    <div className="text-sm font-medium">Date:</div>
                    <div className="text-sm">{formatDate(selectedItem.date)}</div>
                  </div>
                  
                  <div className="pt-4">
                    <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                    <Textarea
                      id="approvalNotes"
                      placeholder="Add any notes about this approval"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedItem?.type}</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this {selectedItem?.type}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-3">
              {selectedItem && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Customer:</div>
                    <div className="text-sm">{selectedItem.customer_name || 'N/A'}</div>
                    
                    <div className="text-sm font-medium">Vehicle:</div>
                    <div className="text-sm">{selectedItem.vehicle_number || 'N/A'}</div>
                    
                    <div className="text-sm font-medium">Fuel Type:</div>
                    <div className="text-sm">{selectedItem.fuel_type}</div>
                    
                    <div className="text-sm font-medium">Amount:</div>
                    <div className="text-sm">₹{selectedItem.amount.toFixed(2)}</div>
                    
                    <div className="text-sm font-medium">Quantity:</div>
                    <div className="text-sm">{selectedItem.quantity.toFixed(2)} L</div>
                    
                    <div className="text-sm font-medium">Date:</div>
                    <div className="text-sm">{formatDate(selectedItem.date)}</div>
                  </div>
                  
                  <div className="pt-4">
                    <Label htmlFor="rejectionNotes">Rejection Reason (Required)</Label>
                    <Textarea
                      id="rejectionNotes"
                      placeholder="Provide a reason for rejecting this item"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isProcessing || !approvalNotes.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.type === 'transaction' ? 'Transaction' : 'Indent'} Details</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm font-medium">Type:</div>
                  <div className="text-sm">{selectedItem.type === 'transaction' ? 'Transaction' : 'Indent'}</div>
                  
                  {selectedItem.indent_number && (
                    <>
                      <div className="text-sm font-medium">Indent Number:</div>
                      <div className="text-sm">#{selectedItem.indent_number}</div>
                    </>
                  )}
                  
                  <div className="text-sm font-medium">Customer:</div>
                  <div className="text-sm">{selectedItem.customer_name || 'N/A'}</div>
                  
                  <div className="text-sm font-medium">Vehicle:</div>
                  <div className="text-sm">{selectedItem.vehicle_number || 'N/A'}</div>
                  
                  <div className="text-sm font-medium">Staff:</div>
                  <div className="text-sm">{selectedItem.staff_name || 'N/A'}</div>
                  
                  <div className="text-sm font-medium">Fuel Type:</div>
                  <div className="text-sm">{selectedItem.fuel_type}</div>
                  
                  <div className="text-sm font-medium">Quantity:</div>
                  <div className="text-sm">{selectedItem.quantity.toFixed(2)} L</div>
                  
                  <div className="text-sm font-medium">Rate:</div>
                  <div className="text-sm">
                    ₹{(selectedItem.amount / selectedItem.quantity).toFixed(2)}/L
                  </div>
                  
                  <div className="text-sm font-medium">Amount:</div>
                  <div className="text-sm">₹{selectedItem.amount.toFixed(2)}</div>
                  
                  <div className="text-sm font-medium">Date:</div>
                  <div className="text-sm">{formatDate(selectedItem.date)}</div>
                  
                  <div className="text-sm font-medium">Created At:</div>
                  <div className="text-sm">{formatDateTime(selectedItem.created_at)}</div>
                  
                  <div className="text-sm font-medium">Status:</div>
                  <div className="text-sm capitalize">{currentTab}</div>
                </div>
                
                {/* Only show buttons for pending items */}
                {currentTab === 'pending' && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-50"
                      onClick={() => {
                        setShowDetailDialog(false);
                        setShowApproveDialog(true);
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setShowDetailDialog(false);
                        setShowRejectDialog(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveMobileOperations;
