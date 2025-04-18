
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type StaffFeature = Database['public']['Enums']['staff_feature'];

interface UsePermissionsResult {
  canAccess: (feature: StaffFeature) => boolean;
  isLoading: boolean;
  error: string | null;
  availableFeatures: StaffFeature[];
  refreshPermissions: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsResult => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [availableFeatures, setAvailableFeatures] = useState<StaffFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    if (!user) {
      setAvailableFeatures([]);
      setIsLoading(false);
      return;
    }

    // Super admins and admins have access to all features
    if (isSuperAdmin || isAdmin) {
      // We'll populate all possible features for admins
      // Use a query to get all possible feature values
      try {
        const { data, error } = await supabase.rpc('get_all_staff_features');
        
        if (error) throw error;
        
        setAvailableFeatures(data || []);
      } catch (err) {
        console.error('Error getting all features:', err);
        // Fallback to hardcoded list of common features
        setAvailableFeatures([
          'view_customers',
          'edit_customers',
          'view_staff',
          'edit_staff',
          'view_transactions',
          'record_transactions',
          'view_indents',
          'create_indents',
          'manage_shifts',
          'view_reports',
          'manage_settings'
        ] as StaffFeature[]);
      }
      
      setIsLoading(false);
      return;
    }

    try {
      // For regular staff, fetch their specific permissions
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('feature')
        .eq('staff_id', user.staffId || user.id);

      if (error) {
        setError(error.message);
        console.error('Error fetching permissions:', error);
        setAvailableFeatures([]);
      } else {
        // Extract just the feature names from the results
        const features = (data || []).map(item => item.feature as StaffFeature);
        setAvailableFeatures(features);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching permissions');
      console.error('Error in usePermissions:', err);
      setAvailableFeatures([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch permissions when the user changes
  useEffect(() => {
    setIsLoading(true);
    fetchPermissions();
  }, [user, isAdmin, isSuperAdmin]);

  // Function to check if user has access to a specific feature
  const canAccess = (feature: StaffFeature): boolean => {
    // Super admins and admins have access to everything
    if (isSuperAdmin || isAdmin) return true;
    
    // If loading or no user, return false
    if (isLoading || !user) return false;
    
    // Check if the feature is in the user's available features
    return availableFeatures.includes(feature);
  };

  // Method to refresh permissions
  const refreshPermissions = async () => {
    setIsLoading(true);
    await fetchPermissions();
  };

  return {
    canAccess,
    isLoading,
    error,
    availableFeatures,
    refreshPermissions
  };
};
