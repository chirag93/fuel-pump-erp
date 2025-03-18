
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type StaffFeature = Database['public']['Enums']['staff_feature'];

const FEATURES: Array<{ id: StaffFeature; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'daily_readings', label: 'Daily Sales Record (DSR)' },
  { id: 'stock_levels', label: 'Stock Levels' },
  { id: 'tank_unload', label: 'Tank Unload' },
  { id: 'customers', label: 'Customers' },
  { id: 'staff_management', label: 'Staff Management' },
  { id: 'record_indent', label: 'Record Indent' },
  { id: 'shift_management', label: 'Shift Management' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'testing', label: 'Testing' },
  { id: 'settings', label: 'Settings' }
];

interface FeatureSelectionProps {
  staffId: string;
  onFeaturesChange: (features: StaffFeature[]) => void;
  initialFeatures?: StaffFeature[];
}

export function FeatureSelection({ staffId, onFeaturesChange, initialFeatures = [] }: FeatureSelectionProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<StaffFeature[]>(initialFeatures);
  const [isLoading, setIsLoading] = useState<boolean>(!!staffId);

  useEffect(() => {
    if (staffId) {
      loadStaffFeatures();
    } else if (initialFeatures.length > 0) {
      setSelectedFeatures(initialFeatures);
      onFeaturesChange(initialFeatures);
    }
  }, [staffId, initialFeatures]);

  const loadStaffFeatures = async () => {
    if (!staffId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('feature')
        .eq('staff_id', staffId);

      if (error) {
        console.error('Error loading staff features:', error);
        return;
      }

      const features = data.map(item => item.feature);
      console.log('Loaded features for staff:', features);
      setSelectedFeatures(features);
      onFeaturesChange(features);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureToggle = (feature: StaffFeature, checked: boolean) => {
    const newFeatures = checked
      ? [...selectedFeatures, feature]
      : selectedFeatures.filter(f => f !== feature);
    
    setSelectedFeatures(newFeatures);
    onFeaturesChange(newFeatures);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">Feature Access</div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading permissions...</div>
      ) : (
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
      )}
    </div>
  );
}
