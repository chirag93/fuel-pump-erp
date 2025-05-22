
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import StaffForm from '@/components/staff/StaffForm';
import { StaffSummaryCards } from '@/components/staff/StaffSummaryCards';
import { StaffSearch } from '@/components/staff/StaffSearch';
import { StaffList } from '@/components/staff/StaffList';
import { useStaffManagement } from '@/hooks/useStaffManagement';

const StaffManagement = () => {
  const {
    staff,
    filteredStaff,
    editingStaff,
    formOpen,
    searchTerm,
    isLoading,
    setEditingStaff,
    setFormOpen,
    setSearchTerm,
    handleSaveStaff,
    handleDeleteStaff
  } = useStaffManagement();

  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormOpen(true);
  };

  const handleEditStaff = (staffMember: any) => {
    // When editing, set empty features array if not present
    if (staffMember && !staffMember.features) {
      staffMember.features = [];
    }
    setEditingStaff(staffMember);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Button onClick={handleAddStaff}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Summary Cards */}
      <StaffSummaryCards staff={staff} />

      {/* Search */}
      <StaffSearch 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      {/* Staff List */}
      <StaffList 
        staff={filteredStaff}
        isLoading={isLoading}
        onEdit={handleEditStaff}
        onDelete={handleDeleteStaff}
      />

      {/* Add/Edit Staff Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          </DialogHeader>
          <StaffForm 
            initialData={editingStaff}
            onSubmit={handleSaveStaff}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
