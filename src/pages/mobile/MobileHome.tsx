
import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, CreditCard, UserRound, CalendarClock, AlertCircle } from 'lucide-react';
import { CardFeature } from '@/components/ui/custom/CardFeature';

const MobileHome = () => {
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="text-center mb-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-primary">Fuel Master</h1>
        <p className="text-muted-foreground text-sm mt-1">Mobile Dashboard</p>
      </div>
      
      <div className="mb-3 p-3 bg-muted rounded-lg animate-fade-in">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
          <p className="text-sm">Operations recorded on mobile require approval before they're finalized.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Link to="/record-indent" className="w-full animate-fade-in delay-100">
          <CardFeature
            title="Indent"
            description="Record"
            icon={<CreditCard className="text-fuelmaster-blue" size={20} />}
          />
        </Link>
        
        <Link to="/shift-management" className="w-full animate-fade-in delay-200">
          <CardFeature
            title="Shift"
            description="Log"
            icon={<CalendarClock className="text-fuelmaster-green" size={20} />}
          />
        </Link>
        
        <Link to="/customers" className="w-full animate-fade-in delay-300">
          <CardFeature
            title="Client"
            description="View"
            icon={<UserRound className="text-fuelmaster-orange" size={20} />}
          />
        </Link>
        
        <Link to="/daily-readings" className="w-full animate-fade-in delay-400">
          <CardFeature
            title="Meter"
            description="Read"
            icon={<Droplets className="text-fuelmaster-teal" size={20} />}
          />
        </Link>
      </div>
    </div>
  );
};

export default MobileHome;
