
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const SuperAdminSettings = () => {
  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'Fuel Master Inc.',
    registrationNumber: 'REG123456789',
    address: '123 Fuel Street, Gas City, 54321',
    email: 'contact@fuelmaster.com',
    phone: '+1 (555) 123-4567'
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [automaticProvisioning, setAutomaticProvisioning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSaveCompanySettings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings Saved',
        description: 'Company settings have been updated',
      });
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Notification Settings Saved',
        description: `Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      
      // Basic validation
      if (!passwordData.currentPassword) {
        toast({
          title: 'Error',
          description: 'Please enter your current password',
          variant: 'destructive'
        });
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: 'Error',
          description: 'New passwords do not match',
          variant: 'destructive'
        });
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully',
      });
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
                <Input 
                  id="companyName" 
                  value={companyInfo.companyName}
                  onChange={handleCompanyInfoChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input 
                  id="registrationNumber" 
                  value={companyInfo.registrationNumber}
                  onChange={handleCompanyInfoChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={companyInfo.address}
                onChange={handleCompanyInfoChange}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={companyInfo.email}
                  onChange={handleCompanyInfoChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input 
                  id="phone" 
                  value={companyInfo.phone}
                  onChange={handleCompanyInfoChange}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveCompanySettings} disabled={loading}>
              Save Company Settings
            </Button>
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveNotificationSettings} disabled={loading}>
              Save Notification Settings
            </Button>
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
              <Input 
                id="currentPassword" 
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange} 
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={handleChangePassword}
              disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
