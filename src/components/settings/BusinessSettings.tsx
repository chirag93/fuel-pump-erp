
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getBusinessSettings, updateBusinessSettings, BusinessSettings as BusinessSettingsType } from '@/integrations/businessSettings';
import { getFuelPumpId } from '@/integrations/utils';
import { useAuth } from '@/contexts/AuthContext';

export function BusinessSettings() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettingsType>({
    gst_number: '',
    business_name: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Use auth context to get fuel pump ID
  const { fuelPumpId } = useAuth();

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      try {
        if (!fuelPumpId) {
          console.log('No fuel pump ID available. Waiting for authentication...');
          return;
        }
        
        setLoading(true);
        console.log("Fetching business settings with fuel pump ID:", fuelPumpId);
        
        const data = await getBusinessSettings();
        if (data) {
          console.log("Fetched business settings:", data);
          setBusinessSettings(data);
        } else {
          console.log("No business settings found, using default empty values");
        }
      } catch (error) {
        console.error('Error fetching business settings:', error);
        toast({
          title: "Error",
          description: "Failed to load business settings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    if (fuelPumpId) {
      fetchBusinessSettings();
    }
  }, [fuelPumpId]);

  const handleUpdateBusinessSettings = async () => {
    if (!fuelPumpId) {
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to update business settings",
        variant: "destructive"
      });
      return;
    }
    
    // Basic validation
    if (!businessSettings.business_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Business name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Updating business settings with fuel pump ID:", fuelPumpId);
      console.log("Settings to update:", { ...businessSettings, fuel_pump_id: fuelPumpId });
      
      const success = await updateBusinessSettings({
        ...businessSettings,
        fuel_pump_id: fuelPumpId
      });
      
      if (success) {
        console.log("Business settings updated successfully");
        toast({
          title: "Success",
          description: "Business settings updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating business settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please check your access rights and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!initialLoadComplete && loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading business settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fuelPumpId && initialLoadComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4">
            <p className="text-muted-foreground">You need to be logged in as a fuel pump administrator to view and edit business settings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Configure business details including GST information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input 
              id="business_name" 
              value={businessSettings.business_name} 
              onChange={e => setBusinessSettings({...businessSettings, business_name: e.target.value})}
              disabled={loading}
              placeholder="Enter business name"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input 
              id="gst_number" 
              value={businessSettings.gst_number} 
              onChange={e => setBusinessSettings({...businessSettings, gst_number: e.target.value})}
              disabled={loading}
              placeholder="Enter GST number"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Business Address</Label>
          <Input 
            id="address" 
            value={businessSettings.address || ''} 
            onChange={e => setBusinessSettings({...businessSettings, address: e.target.value})}
            disabled={loading}
            placeholder="Enter full address"
          />
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleUpdateBusinessSettings} 
            disabled={loading || !fuelPumpId}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Business Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
