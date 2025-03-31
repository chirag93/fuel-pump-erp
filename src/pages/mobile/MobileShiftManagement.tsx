
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CalendarClock, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MobileActiveShifts } from '@/components/shift/MobileActiveShifts';

const MobileShiftManagement = () => {
  const {
    staffList,
    activeShifts,
    newShift,
    setNewShift,
    handleAddShift,
    isLoading,
    fetchShifts
  } = useShiftManagement();
  
  const [formOpen, setFormOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleOpenForm = () => {
    if (staffList.length === 0) {
      toast({
        title: "No Staff Available",
        description: "There are no active staff members available to assign shifts.",
        variant: "destructive"
      });
      return;
    }
    setFormOpen(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully."
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link to="/mobile">
            <Button variant="ghost" size="icon" className="mr-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Shift Management</h1>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setLogoutDialogOpen(true)}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5 text-destructive" />
        </Button>
      </div>
      
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center mb-2">
            <CalendarClock className="h-5 w-5 text-primary mr-2" />
            <CardTitle>Start New Shift</CardTitle>
          </div>
          <CardDescription>
            Record shift details including staff and opening cash amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading staff data...</span>
            </div>
          ) : (
            <Button 
              onClick={handleOpenForm} 
              className="w-full"
              variant="default"
              size="lg"
              disabled={isLoading}
            >
              Start New Shift
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Shifts Section */}
      <MobileActiveShifts 
        activeShifts={activeShifts} 
        isLoading={isLoading} 
        onEndShift={(shift) => {
          toast({
            title: "Feature in development",
            description: "End shift functionality is available on desktop version."
          });
        }} 
      />
      
      {/* StartShiftForm Modal */}
      <StartShiftForm
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        newShift={newShift}
        setNewShift={setNewShift}
        handleAddShift={handleAddShift}
        staffList={staffList}
        isMobile={true}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your current session and return you to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MobileShiftManagement;
