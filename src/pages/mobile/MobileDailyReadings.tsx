
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TankReadingsForm from '@/components/daily-readings/TankReadingsForm';

const MobileDailyReadings = () => {
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center mb-4">
        <Link to="/mobile">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Daily Meter Readings</h1>
      </div>
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <Droplets className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Record Today's Readings</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Enter the current meter readings for each fuel pump to track daily sales.
          </p>
          
          <TankReadingsForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDailyReadings;
