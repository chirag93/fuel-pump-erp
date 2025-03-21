
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';

interface BusinessSettings {
  id?: string;
  gst_number: string;
  business_name: string;
  address: string;
}

export function BusinessSettings() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    gst_number: '',
    business_name: 'Fuel Pump ERP',
    address: '',
  });

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .maybeSingle();
        
      if (!error && data) {
        setBusinessSettings(data as BusinessSettings);
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
      toast({
        title: "Error",
        description: "Failed to load business settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBusinessSettings = async () => {
    try {
      if (!businessSettings.gst_number) {
        toast({
          title: "Missing information",
          description: "Please enter GST number",
          variant: "destructive"
        });
        return;
      }
      
      const { data: existingData, error: existingError } = await supabase
        .from('business_settings')
        .select('*');
        
      if (existingError) throw existingError;
      
      if (existingData && existingData.length > 0) {
        const { error } = await supabase
          .from('business_settings')
          .update({
            gst_number: businessSettings.gst_number,
            business_name: businessSettings.business_name,
            address: businessSettings.address
          })
          .eq('id', existingData[0].id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_settings')
          .insert([{
            gst_number: businessSettings.gst_number,
            business_name: businessSettings.business_name,
            address: businessSettings.address
          }]);
          
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: "Business settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating business settings:', error);
      toast({
        title: "Error",
        description: "Failed to update business settings. Please try again.",
        variant: "destructive"
      });
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
