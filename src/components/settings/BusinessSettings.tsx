
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getBusinessSettings, updateBusinessSettings, BusinessSettings as BusinessSettingsType } from '@/integrations/businessSettings';

export function BusinessSettings() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettingsType>({
    gst_number: '',
    business_name: 'Fuel Pump ERP',
    address: '',
  });

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const data = await getBusinessSettings();
      if (data) {
        setBusinessSettings(data);
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }
  };

  const handleUpdateBusinessSettings = async () => {
    try {
      const success = await updateBusinessSettings(businessSettings);
      if (success) {
        toast({
          title: "Success",
          description: "Business settings updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating business settings:', error);
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
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input 
              id="gst_number" 
              value={businessSettings.gst_number} 
              onChange={e => setBusinessSettings({...businessSettings, gst_number: e.target.value})}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Business Address</Label>
          <Input 
            id="address" 
            value={businessSettings.address} 
            onChange={e => setBusinessSettings({...businessSettings, address: e.target.value})}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleUpdateBusinessSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Business Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
