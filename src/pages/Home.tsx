
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
  CreditCard,
  ClipboardList,
  Camera,
  BarChart,
} from 'lucide-react';
import FuelTankDisplay from '@/components/fuel/FuelTankDisplay';
import { getFuelLevels } from '@/utils/fuelCalculations';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
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
  // Get current fuel levels
  const fuelLevels = getFuelLevels();

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
          <FuelTankDisplay 
            fuelType="Petrol" 
            capacity={fuelLevels.Petrol.capacity} 
            currentLevel={fuelLevels.Petrol.current} 
            lastUpdated="Today, 8:30 AM"
          />
          <FuelTankDisplay 
            fuelType="Diesel" 
            capacity={fuelLevels.Diesel.capacity} 
            currentLevel={fuelLevels.Diesel.current} 
            lastUpdated="Today, 8:30 AM"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <QuickAction
            title="Daily Readings"
            description="Add shift-wise opening and closing readings"
            icon={<Droplets size={20} />}
            href="/shift"
          />
          
          <QuickAction
            title="Tank Unload"
            description="Record incoming tank unloads and payments"
            icon={<Truck size={20} />}
            href="/consumables"
          />
          
          <QuickAction
            title="Stock Levels"
            description="Record end-of-day stock levels"
            icon={<Package size={20} />}
            href="/consumables"
          />
          
          <QuickAction
            title="Testing Details"
            description="Record fuel testing information"
            icon={<ClipboardList size={20} />}
            href="/consumables"
          />
          
          <QuickAction
            title="Record Transaction"
            description="Record sales via QR, card, or cash"
            icon={<CreditCard size={20} />}
            href="/fueling"
          />
          
          <QuickAction
            title="Staff Cash"
            description="Record cash provided to staff at shift start"
            icon={<BarChart size={20} />}
            href="/staff"
          />
          
          <QuickAction
            title="Fuel Dispensing"
            description="Record fuel dispensing for customers"
            icon={<Camera size={20} />}
            href="/fueling"
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
