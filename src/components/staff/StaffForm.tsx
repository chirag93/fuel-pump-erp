
import { Button } from '@/components/ui/button';
import { useStaffForm } from '@/hooks/useStaffForm';
import { PumpSelection } from './PumpSelection';
import { BasicInfoFields } from './BasicInfoFields';
import { useRef, useEffect } from 'react';

interface StaffFormProps {
  onSubmit: (staff: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const StaffForm = ({ onSubmit, onCancel, initialData }: StaffFormProps) => {
  // Use a ref to track initialization
  const initialized = useRef(false);
  
  const {
    staffData,
    selectedFeatures,
    errors,
    isSubmitting,
    selectedPump,
    changePassword,
    mobileOnlyAccess,
    handleChange,
    handleAddPump,
    handleRemovePump,
    handleSubmit,
    setSelectedFeatures,
    setSelectedPump,
    setChangePassword,
    setMobileOnlyAccess
  } = useStaffForm(initialData, onSubmit, onCancel);

  // Log initialization only once
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      if (initialData?.id) {
        console.log("StaffForm initialized with initialData ID:", initialData.id);
      } else {
        console.log("StaffForm initialized for new staff creation");
      }
    }
  }, [initialData?.id]);

  // Set a default empty array for features since we're hiding the selection
  useEffect(() => {
    setSelectedFeatures([]);
  }, [setSelectedFeatures]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BasicInfoFields
        staffData={staffData}
        errors={errors}
        isEditing={!!initialData}
        onChange={handleChange}
        changePassword={changePassword}
        setChangePassword={setChangePassword}
        mobileOnlyAccess={mobileOnlyAccess}
        setMobileOnlyAccess={setMobileOnlyAccess}
      />

      <PumpSelection
        selectedPump={selectedPump}
        onPumpSelect={setSelectedPump}
        onAddPump={handleAddPump}
        onRemovePump={handleRemovePump}
        assignedPumps={staffData.assigned_pumps}
      />

      {/* Feature selection has been hidden for now */}
      {/* To be implemented later */}
      {/* 
      <FeatureSelection
        staffId={initialData?.id}
        onFeaturesChange={setSelectedFeatures}
        initialFeatures={initialData?.features || []}
      />
      */}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="mr-2">Saving...</span>
              <span className="animate-spin">⌛</span>
            </>
          ) : (
            'Save Staff'
          )}
        </Button>
      </div>
    </form>
  );
};

export default StaffForm;
