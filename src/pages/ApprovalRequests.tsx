
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import TransactionsTable from '@/components/approval-requests/TransactionsTable';
import IndentsTable from '@/components/approval-requests/IndentsTable';
import ApprovalDialog from '@/components/approval-requests/ApprovalDialog';
import { useApprovalRequests } from '@/hooks/useApprovalRequests';
import { getFuelPumpId } from '@/integrations/utils';
import { supabase } from '@/integrations/supabase/client';

// Define local interfaces that match the component prop types
interface LocalTransaction {
  id: string;
  date: string;
  amount: number;
  customer_name?: string;
  vehicle_number?: string;
  fuel_type: string;
  quantity: number;
  payment_method: string;
  source?: string;
  staff_name?: string;
  fuel_pump_id?: string;
  fuel_pump_name?: string;
}

interface LocalIndent {
  id: string;
  date: string;
  indent_number: string;
  customer_name?: string;
  vehicle_number?: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  source?: string;
  fuel_pump_id?: string;
}

// Main component for the approval requests page content
const ApprovalRequestsPage = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  
  const {
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
    processApproval
  } = useApprovalRequests(user?.id);
  
  // Check if current user is a super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      const fuelPumpId = await getFuelPumpId();
      // If fuelPumpId is null and the user is logged in, they're likely a super admin
      setIsSuperAdmin(fuelPumpId === null && !!user?.id);
    };
    
    checkSuperAdmin();
  }, [user?.id]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Requests</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage pending approval requests for transactions and indents.
        </p>
        {isSuperAdmin && (
          <p className="text-sm text-amber-600 mt-1">
            You are viewing approval requests from all fuel pumps as a Super Admin.
          </p>
        )}
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
              <TransactionsTable 
                transactions={pendingTransactions as LocalTransaction[]}
                isLoading={isLoading}
                onApprove={(transaction) => handleApprove(transaction)}
                onReject={(transaction) => handleReject(transaction)}
                showFuelPumpInfo={isSuperAdmin}
              />
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
              <IndentsTable 
                indents={pendingIndents as LocalIndent[]}
                isLoading={isLoading}
                onApprove={(indent) => handleApprove(indent)}
                onReject={(indent) => handleReject(indent)}
                showFuelPumpInfo={isSuperAdmin}
              />
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
              <TransactionsTable 
                transactions={pendingTransactions as LocalTransaction[]}
                isLoading={isLoading}
                onApprove={(transaction) => handleApprove(transaction)}
                onReject={(transaction) => handleReject(transaction)}
                showFuelPumpInfo={isSuperAdmin}
              />
              
              <h3 className="font-medium mt-6 mb-2">Indents</h3>
              <IndentsTable 
                indents={pendingIndents as LocalIndent[]}
                isLoading={isLoading}
                onApprove={(indent) => handleApprove(indent)}
                onReject={(indent) => handleReject(indent)}
                showFuelPumpInfo={isSuperAdmin}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        selectedItem={selectedItem}
        notes={approvalNotes}
        onNotesChange={setApprovalNotes}
        onConfirm={processApproval}
        isProcessing={isProcessing}
        actionType="approve"
      />
      
      {/* Rejection Dialog */}
      <ApprovalDialog
        isOpen={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        selectedItem={selectedItem}
        notes={approvalNotes}
        onNotesChange={setApprovalNotes}
        onConfirm={processApproval}
        isProcessing={isProcessing}
        actionType="reject"
      />
    </div>
  );
};

export default ApprovalRequestsPage;
