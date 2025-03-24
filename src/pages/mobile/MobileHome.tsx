
import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, CreditCard, UserRound, CalendarClock } from 'lucide-react';
import { CardFeature } from '@/components/ui/custom/CardFeature';

const MobileHome = () => {
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="text-center mb-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-primary">Fuel Master</h1>
        <p className="text-muted-foreground text-sm mt-1">Mobile Dashboard</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Link to="/record-indent" className="w-full animate-fade-in delay-100">
          <CardFeature
            title="Indent"
            description="Add"
            icon={<CreditCard className="text-fuelmaster-blue" size={20} />}
          />
        </Link>
        
        <Link to="/shift-management" className="w-full animate-fade-in delay-200">
          <CardFeature
            title="Shifts"
            description="Log"
            icon={<CalendarClock className="text-fuelmaster-green" size={20} />}
          />
        </Link>
        
        <Link to="/customers" className="w-full animate-fade-in delay-300">
          <CardFeature
            title="Clients"
            description="View"
            icon={<UserRound className="text-fuelmaster-orange" size={20} />}
          />
        </Link>
        
        <Link to="/daily-readings" className="w-full animate-fade-in delay-400">
          <CardFeature
            title="Meters"
            description="Read"
            icon={<Droplets className="text-fuelmaster-teal" size={20} />}
          />
        </Link>
      </div>
    </div>
  );
};

export default MobileHome;
