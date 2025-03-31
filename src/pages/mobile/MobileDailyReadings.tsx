
import React from 'react';
import { MobileHeader } from '@/components/mobile/MobileHeader';

const MobileDailyReadings = () => {
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <MobileHeader title="Daily Readings" />
      
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">
          Daily readings functionality will be available soon.
        </p>
      </div>
    </div>
  );
};

export default MobileDailyReadings;
