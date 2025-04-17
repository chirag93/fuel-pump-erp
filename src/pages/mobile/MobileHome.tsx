
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, UserRound, CalendarClock, AlertCircle, Droplets } from 'lucide-react';
import { CardFeature } from '@/components/ui/custom/CardFeature';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { getBusinessSettings } from '@/integrations/businessSettings';
import { Logo } from '@/components/ui/logo';

const MobileHome = () => {
  const { fuelPumpName } = useAuth();
  const [businessName, setBusinessName] = useState<string>('');
  
  // Fetch business name from settings
  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const businessSettings = await getBusinessSettings();
        if (businessSettings && businessSettings.business_name) {
          setBusinessName(businessSettings.business_name);
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
      }
    };

    fetchBusinessName();
  }, []);
  
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="text-center mb-6 animate-fade-in">
        <div className="flex justify-center mb-3">
          <Logo size="lg" className="h-16 w-auto" />
        </div>
        <p className="text-muted-foreground text-sm mt-1">Mobile Dashboard</p>
        <MobileHeader title="" showBackButton={false} />
      </div>
      
      <div className="mb-3 p-3 bg-muted rounded-lg animate-fade-in">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
          <p className="text-sm">Operations recorded on mobile require approval before they're finalized.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Link to="/mobile/record-indent" className="w-full animate-fade-in delay-100">
          <CardFeature
            title="Indent"
            description="Record"
            icon={<CreditCard className="text-primary" size={28} />}
            className="p-4"
          />
        </Link>
        
        <Link to="/mobile/shift-management" className="w-full animate-fade-in delay-200">
          <CardFeature
            title="Shift"
            description="Log"
            icon={<CalendarClock className="text-green-500" size={28} />}
            className="p-4"
          />
        </Link>
        
        <Link to="/mobile/customers" className="w-full animate-fade-in delay-300">
          <CardFeature
            title="Client"
            description="View"
            icon={<UserRound className="text-orange-500" size={28} />}
            className="p-4"
          />
        </Link>
        
        <Link to="/mobile/dsr" className="w-full animate-fade-in delay-400">
          <CardFeature
            title="Sales"
            description="Record"
            icon={<Droplets className="text-blue-500" size={28} />}
            className="p-4"
          />
        </Link>
      </div>
    </div>
  );
};

export default MobileHome;
