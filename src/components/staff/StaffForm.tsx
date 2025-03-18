
import { Button } from '@/components/ui/button';
import { useStaffForm } from '@/hooks/useStaffForm';
import { FeatureSelection } from './FeatureSelection';
import { PumpSelection } from './PumpSelection';
import { BasicInfoFields } from './BasicInfoFields';

interface StaffFormProps {
  onSubmit: (staff: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const StaffForm = ({ onSubmit, onCancel, initialData }: StaffFormProps) => {
  const {
    staffData,
    selectedFeatures,
    errors,
    isSubmitting,
    selectedPump,
    handleChange,
    handleAddPump,
    handleRemovePump,
    handleSubmit,
    setSelectedFeatures,
    setSelectedPump
  } = useStaffForm(initialData, onSubmit, onCancel);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BasicInfoFields
        staffData={staffData}
        errors={errors}
        isEditing={!!initialData}
        onChange={handleChange}
      />

      <PumpSelection
        selectedPump={selectedPump}
        onPumpSelect={setSelectedPump}
        onAddPump={handleAddPump}
        onRemovePump={handleRemovePump}
        assignedPumps={staffData.assigned_pumps}
      />

      <FeatureSelection
        staffId={initialData?.id}
        onFeaturesChange={setSelectedFeatures}
        initialFeatures={[]}
      />

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
