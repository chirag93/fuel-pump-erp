
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getBusinessSettings, updateBusinessSettings, BusinessSettings as BusinessSettingsType } from '@/integrations/businessSettings';
import { getFuelPumpId } from '@/integrations/utils';

export function BusinessSettings() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettingsType>({
    gst_number: '',
    business_name: 'Fuel Pump ERP',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);

  useEffect(() => {
    const initFuelPumpId = async () => {
      const id = await getFuelPumpId();
      setFuelPumpId(id);
      if (id) {
        fetchBusinessSettings();
      } else {
        console.log('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view business settings",
          variant: "destructive"
        });
      }
    };
    
    initFuelPumpId();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      setLoading(true);
      const data = await getBusinessSettings();
      if (data) {
        setBusinessSettings(data);
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBusinessSettings = async () => {
    if (!fuelPumpId) {
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to update business settings",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      // Ensure the fuel_pump_id is included
      const settingsWithPumpId = {
        ...businessSettings,
        fuel_pump_id: fuelPumpId
      };
      
      const success = await updateBusinessSettings(settingsWithPumpId);
      if (success) {
        toast({
          title: "Success",
          description: "Business settings updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating business settings:', error);
    } finally {
      setLoading(false);
    }
  };

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
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input 
              id="gst_number" 
              value={businessSettings.gst_number} 
              onChange={e => setBusinessSettings({...businessSettings, gst_number: e.target.value})}
              disabled={loading}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Business Address</Label>
          <Input 
            id="address" 
            value={businessSettings.address} 
            onChange={e => setBusinessSettings({...businessSettings, address: e.target.value})}
            disabled={loading}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleUpdateBusinessSettings} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Business Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
