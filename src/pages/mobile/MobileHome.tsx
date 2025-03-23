
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, CreditCard, UserRound, CalendarClock } from 'lucide-react';
import { CardFeature } from '@/components/ui/custom/CardFeature';

const MobileHome = () => {
  return (
    <div className="container mx-auto py-6 px-4 flex flex-col min-h-screen">
      <div className="text-center mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-primary">Fuel Master</h1>
        <p className="text-muted-foreground mt-2">Mobile Dashboard</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 justify-items-center mb-6">
        <Link to="/record-indent" className="w-full animate-fade-in delay-100">
          <CardFeature
            title="Record Indent"
            description="Fuel transactions"
            icon={<CreditCard className="text-fuelmaster-blue" size={24} />}
          />
        </Link>
        
        <Link to="/shift-management" className="w-full animate-fade-in delay-200">
          <CardFeature
            title="Shift Management"
            description="Manage shifts"
            icon={<CalendarClock className="text-fuelmaster-green" size={24} />}
          />
        </Link>
        
        <Link to="/customers" className="w-full animate-fade-in delay-300">
          <CardFeature
            title="Customers"
            description="View customers"
            icon={<UserRound className="text-fuelmaster-orange" size={24} />}
          />
        </Link>
        
        <Link to="/daily-readings" className="w-full animate-fade-in delay-400">
          <CardFeature
            title="Daily Readings"
            description="Fuel readings"
            icon={<Droplets className="text-fuelmaster-teal" size={24} />}
          />
        </Link>
      </div>
    </div>
  );
};

export default MobileHome;
