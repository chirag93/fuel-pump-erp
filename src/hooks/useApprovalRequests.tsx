
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Transaction, Indent } from '@/integrations/supabase/client';

export const useApprovalRequests = (userId: string | undefined) => {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [pendingIndents, setPendingIndents] = useState<Indent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<Transaction | Indent | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState<boolean>(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject'>('approve');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('transactions');

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
          console.log('Fetched pending indents:', indentData);
          const formattedIndents = indentData.map((item: any) => ({
            ...item,
            customer_name: item.customers?.name || 'Mobile User',
            vehicle_number: item.vehicles?.number || 'N/A'
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

  useEffect(() => {
    fetchPendingItems();
  }, [activeTab]);

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
    if (!selectedItem || !userId) return;
    
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
          approved_by: userId
        })
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      // If this is a transaction with an indent_id and we're approving it, also approve the indent
      if (!isIndentItem(selectedItem) && selectedItem.indent_id && currentAction === 'approve') {
        const { error: indentError } = await supabase
          .from('indents')
          .update({
            approval_status: status,
            approval_notes: approvalNotes,
            approval_date: new Date().toISOString(),
            approved_by: userId
          })
          .eq('id', selectedItem.indent_id);
          
        if (indentError) {
          console.error('Error updating linked indent:', indentError);
        }
      }
      
      // If this is an indent and we're approving/rejecting it, also update any linked transactions
      if (isIndentItem(selectedItem)) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({
            approval_status: status,
            approval_notes: approvalNotes,
            approval_date: new Date().toISOString(),
            approved_by: userId
          })
          .eq('indent_id', selectedItem.id);
          
        if (transactionError) {
          console.error('Error updating linked transaction:', transactionError);
        }
      }
      
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
  
  // Function to safely check if an item is an Indent
  const isIndentItem = (item: any): item is Indent => {
    if (!item) return false;
    return 'indent_number' in item;
  };

  return {
    pendingTransactions,
    pendingIndents,
    isLoading,
    selectedItem,
    approvalDialogOpen,
    setApprovalDialogOpen,
    rejectionDialogOpen,
    setRejectionDialogOpen,
    approvalNotes,
    setApprovalNotes,
    currentAction,
    isProcessing,
    activeTab,
    setActiveTab,
    handleApprove,
    handleReject,
    processApproval,
    fetchPendingItems,
    isIndentItem
  };
};
