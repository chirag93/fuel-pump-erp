
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

// Define staff feature type from database enum
type StaffFeature = Database['public']['Enums']['staff_feature'];

// Define features that staff members can have
const FEATURES: Array<{ id: StaffFeature; label: string }> = [
  { id: 'view_customers', label: 'View Customers' },
  { id: 'edit_customers', label: 'Edit Customers' },
  { id: 'view_staff', label: 'View Staff' },
  { id: 'edit_staff', label: 'Manage Staff' },
  { id: 'view_transactions', label: 'View Transactions' },
  { id: 'record_transactions', label: 'Record Transactions' },
  { id: 'view_indents', label: 'View Indents' },
  { id: 'create_indents', label: 'Create Indents' },
  { id: 'manage_shifts', label: 'Shift Management' },
  { id: 'view_reports', label: 'View Reports' },
  { id: 'manage_settings', label: 'Manage Settings' }
];

interface FeatureSelectionProps {
  staffId?: string;
  onFeaturesChange: (features: StaffFeature[]) => void;
  initialFeatures?: StaffFeature[];
}

export function FeatureSelection({ staffId, onFeaturesChange, initialFeatures = [] }: FeatureSelectionProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<StaffFeature[]>(initialFeatures);

  useEffect(() => {
    if (staffId) {
      loadStaffFeatures();
    } else {
      // If no staffId (new staff), use initialFeatures
      setSelectedFeatures(initialFeatures);
      onFeaturesChange(initialFeatures);
    }
  }, [staffId, initialFeatures]);

  const loadStaffFeatures = async () => {
    if (!staffId) return;

    try {
      console.log("Loading features for staff ID:", staffId);
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('feature')
        .eq('staff_id', staffId);

      if (error) {
        console.error('Error loading staff features:', error);
        return;
      }

      const features = data?.map(item => item.feature as StaffFeature) || [];
      console.log("Loaded features:", features);
      setSelectedFeatures(features);
      onFeaturesChange(features);
    } catch (error) {
      console.error('Error in loadStaffFeatures:', error);
    }
  };

  const handleFeatureToggle = (feature: StaffFeature, checked: boolean) => {
    const newFeatures = checked
      ? [...selectedFeatures, feature]
      : selectedFeatures.filter(f => f !== feature);
    
    console.log("Feature toggled:", feature, "New features:", newFeatures);
    setSelectedFeatures(newFeatures);
    onFeaturesChange(newFeatures);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">Feature Access</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map(feature => (
          <div key={feature.id} className="flex items-center space-x-2">
            <Checkbox
              id={feature.id}
              checked={selectedFeatures.includes(feature.id)}
              onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked as boolean)}
            />
            <Label htmlFor={feature.id}>{feature.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
