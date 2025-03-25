
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import { useShiftManagement } from '@/hooks/useShiftManagement';

const MobileShiftManagement = () => {
  const {
    staffList,
    newShift,
    setNewShift,
    handleAddShift
  } = useShiftManagement();
  
  const [formOpen, setFormOpen] = useState(false);
  
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center mb-4">
        <Link to="/mobile">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Shift Management</h1>
      </div>
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <CalendarClock className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Start New Shift</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Record shift details including staff and opening cash amount.
          </p>
          
          <StartShiftForm
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            newShift={newShift}
            setNewShift={setNewShift}
            handleAddShift={handleAddShift}
            staffList={staffList}
            isMobile={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileShiftManagement;
