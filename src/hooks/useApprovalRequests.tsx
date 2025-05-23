
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Transaction, Indent } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';

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
      // Get current user's fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      console.log('Fetching approval requests for fuel pump ID:', fuelPumpId);
      
      if (activeTab === 'transactions' || activeTab === 'all') {
        console.log('Fetching pending transactions...');
        // Build query for pending transactions
        let transactionQuery = supabase
          .from('transactions')
          .select(`
            *,
            customers:customer_id (name),
            vehicles:vehicle_id (number),
            staff:staff_id (name)
          `)
          .eq('approval_status', 'pending');
        
        // Add fuel pump filter if not a super admin
        if (fuelPumpId) {
          transactionQuery = transactionQuery.eq('fuel_pump_id', fuelPumpId);
        }
        
        const { data: transactionData, error: transactionError } = await transactionQuery;
        
        if (transactionError) throw transactionError;
        
        if (transactionData) {
          console.log('Fetched pending transactions:', transactionData.length);
          const formattedTransactions = transactionData.map((item: any) => ({
            ...item,
            customer_name: item.customers?.name || 'Unknown',
            vehicle_number: item.vehicles?.number || 'N/A',
            staff_name: item.staff?.name
          }));
          
          setPendingTransactions(formattedTransactions);
        }
      }
      
      if (activeTab === 'indents' || activeTab === 'all') {
        console.log('Fetching pending indents...');
        // Build query for pending indents
        let indentQuery = supabase
          .from('indents')
          .select(`
            *,
            customers:customer_id (name),
            vehicles:vehicle_id (number)
          `)
          .eq('approval_status', 'pending');
        
        // Add fuel pump filter if not a super admin
        if (fuelPumpId) {
          indentQuery = indentQuery.eq('fuel_pump_id', fuelPumpId);
        }
        
        const { data: indentData, error: indentError } = await indentQuery;
        
        if (indentError) throw indentError;
        
        if (indentData) {
          console.log('Fetched pending indents:', indentData.length);
          const formattedIndents = indentData.map((item: any) => ({
            ...item,
            customer_name: item.customers?.name || 'Unknown',
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
      
      console.log(`Processing ${currentAction} for ${tableName} with ID ${selectedItem.id}`);
      
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
