import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ModuleIcons } from '@/assets/icons';
import {
  Droplets,
  FileText,
  Package,
  Truck,
  ClipboardList,
  Wrench,
  BarChart,
  TestTube,
  Users,
} from 'lucide-react';
import FuelTankDisplay from '@/components/fuel/FuelTankDisplay';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

interface FuelLevel {
  fuelType: 'Petrol' | 'Diesel';
  capacity: number;
  lastUpdated: string;
}

const QuickAction = ({
  title,
  description,
  icon,
  href,
  onClick,
  className,
}: QuickActionProps) => {
  const content = (
    <Card className={`transition-all hover:shadow-md hover:border-primary/50 cursor-pointer ${className}`}>
      <CardHeader className="p-4 pb-2">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
};

const Home = () => {
  const [fuelLevels, setFuelLevels] = useState<FuelLevel[]>([
    { fuelType: 'Petrol', capacity: 10000, lastUpdated: 'Loading...' },
    { fuelType: 'Diesel', capacity: 12000, lastUpdated: 'Loading...' }
  ]);

  // Fetch fuel levels from the database
  useEffect(() => {
    const fetchFuelLevels = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Group the latest entries by fuel type
          const latestByFuelType: Record<string, any> = {};
          data.forEach(item => {
            // Only process Petrol and Diesel fuel types (no CNG)
            if ((item.fuel_type === 'Petrol' || item.fuel_type === 'Diesel') && 
                (!latestByFuelType[item.fuel_type] || new Date(item.date) > new Date(latestByFuelType[item.fuel_type].date))) {
              latestByFuelType[item.fuel_type] = item;
            }
          });
          
          // Format the data for our component
          const fuelData = Object.values(latestByFuelType).map(item => {
            // Ensure we have a valid fuel_type before using it
            if (item && typeof item.fuel_type === 'string') {
              return {
                fuelType: item.fuel_type as 'Petrol' | 'Diesel',
                capacity: item.fuel_type === 'Petrol' ? 10000 : 12000, // Default capacities
                lastUpdated: item.date ? new Date(item.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Unknown'
              }
            }
            return null;
          }).filter(Boolean) as FuelLevel[];
          
          if (fuelData.length > 0) {
            setFuelLevels(fuelData);
          }
        }
      } catch (error) {
        console.error('Error fetching fuel levels:', error);
      }
    };
    
    fetchFuelLevels();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Home</h2>
        <p className="text-muted-foreground">Quick access to frequent operations</p>
      </div>

      {/* Fuel Tank Status */}
      <div>
        <h3 className="mb-4 text-xl font-semibold">Fuel Storage Status</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {fuelLevels.map((fuel, index) => (
            <FuelTankDisplay 
              key={index}
              fuelType={fuel.fuelType} 
              capacity={fuel.capacity} 
              lastUpdated={fuel.lastUpdated}
              showTankIcon={true}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <QuickAction
            title="Daily Readings"
            description="Add shift-wise opening and closing readings"
            icon={<Droplets size={20} />}
            href="/daily-readings"
          />
          
          <QuickAction
            title="Tank Unload"
            description="Record incoming fuel unloads and payments"
            icon={<Truck size={20} />}
            href="/tank-unload"
          />
          
          <QuickAction
            title="Testing Details"
            description="Record fuel testing information"
            icon={<TestTube size={20} />}
            href="/testing-details"
          />
          
          <QuickAction
            title="Staff Management"
            description="Manage staff and shift assignments"
            icon={<Users size={20} />}
            href="/staff-management"
          />
          
          <QuickAction
            title="Consumables"
            description="Manage station consumables and parts"
            icon={<Wrench size={20} />}
            href="/consumables"
          />
          
          <QuickAction
            title="Reports"
            description="View daily and periodic reports"
            icon={<FileText size={20} />}
            href="/reports"
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold">Recent Activity</h3>
        <div className="space-y-4">
          {[
            {
              time: "10:45 AM",
              action: "Shift started by Raj Kumar",
              type: "shift-start"
            },
            {
              time: "10:30 AM",
              action: "₹2,500 cash provided to Amit Singh",
              type: "cash-provided"
            },
            {
              time: "09:15 AM",
              action: "Tank unload received: 5,000L Petrol",
              type: "tank-unload"
            },
            {
              time: "Yesterday",
              action: "End of day stock recorded: Petrol 75%, Diesel 60%",
              type: "stock-level"
            },
          ].map((activity, i) => (
            <div key={i} className="flex items-center rounded-lg border p-3">
              <div className="mr-4 font-medium">{activity.time}</div>
              <div>{activity.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
