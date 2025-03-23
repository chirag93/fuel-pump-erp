
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, CreditCard, UserRound, CalendarClock } from 'lucide-react';
import { CardFeature } from '@/components/ui/custom/CardFeature';

const MobileHome = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Fuel Master</h1>
        <p className="text-muted-foreground">Mobile Dashboard</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Link to="/record-indent">
          <CardFeature
            title="Record Indent"
            description="Record fuel transactions"
            icon={<CreditCard size={24} />}
          />
        </Link>
        
        <Link to="/shift-management">
          <CardFeature
            title="Shift Management"
            description="Start & end shifts"
            icon={<CalendarClock size={24} />}
          />
        </Link>
        
        <Link to="/customers">
          <CardFeature
            title="Customers"
            description="View customer information"
            icon={<UserRound size={24} />}
          />
        </Link>
        
        <Link to="/daily-readings">
          <CardFeature
            title="Daily Readings"
            description="Record fuel readings"
            icon={<Droplets size={24} />}
          />
        </Link>
      </div>
    </div>
  );
};

export default MobileHome;
