
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const SuperAdminSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [automaticProvisioning, setAutomaticProvisioning] = useState(false);

  const handleSaveCompanySettings = () => {
    toast({
      title: 'Settings Saved',
      description: 'Company settings have been updated',
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: 'Notification Settings Saved',
      description: `Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your super admin account and system preferences
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your company details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="Fuel Master Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyRegistration">Registration Number</Label>
                <Input id="companyRegistration" defaultValue="REG123456789" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Input id="companyAddress" defaultValue="123 Fuel Street, Gas City, 54321" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Contact Email</Label>
                <Input id="companyEmail" type="email" defaultValue="contact@fuelmaster.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Contact Phone</Label>
                <Input id="companyPhone" defaultValue="+1 (555) 123-4567" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveCompanySettings}>Save Company Settings</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure when and how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications when new fuel pumps are provisioned
                </p>
              </div>
              <Switch 
                id="notifications" 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoProvision">Automatic Provisioning</Label>
                <p className="text-sm text-muted-foreground">
                  Allow pump managers to self-provision (requires approval)
                </p>
              </div>
              <Switch 
                id="autoProvision" 
                checked={automaticProvisioning}
                onCheckedChange={setAutomaticProvisioning}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveNotificationSettings}>Save Notification Settings</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage security settings for the super admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Change Password</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
