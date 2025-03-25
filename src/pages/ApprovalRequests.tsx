
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import TransactionsTable from '@/components/approval-requests/TransactionsTable';
import IndentsTable from '@/components/approval-requests/IndentsTable';
import ApprovalDialog from '@/components/approval-requests/ApprovalDialog';
import { useApprovalRequests } from '@/hooks/useApprovalRequests';

// Main component for the approval requests page content
const ApprovalRequestsPage = () => {
  const { user } = useAuth();
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
  
  return (
    <DashboardLayout>
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
                <TransactionsTable 
                  transactions={pendingTransactions}
                  isLoading={isLoading}
                  onApprove={handleApprove}
                  onReject={handleReject}
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
                  indents={pendingIndents}
                  isLoading={isLoading}
                  onApprove={handleApprove}
                  onReject={handleReject}
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
                  transactions={pendingTransactions}
                  isLoading={isLoading}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
                
                <h3 className="font-medium mt-6 mb-2">Indents</h3>
                <IndentsTable 
                  indents={pendingIndents}
                  isLoading={isLoading}
                  onApprove={handleApprove}
                  onReject={handleReject}
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
    </DashboardLayout>
  );
};

export default ApprovalRequestsPage;
