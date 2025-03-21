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
  Wrench,
  BarChart,
  TestTube,
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

interface RecentActivity {
  id: string;
  time: string;
  action: string;
  type: string;
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
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  // Fetch fuel levels from the database with tank capacities from settings
  useEffect(() => {
    const fetchFuelLevels = async () => {
      try {
        // First, get the fuel settings to get tank capacities
        const { data: fuelSettingsData, error: fuelSettingsError } = await supabase
          .from('fuel_settings')
          .select('fuel_type, tank_capacity, current_level, updated_at');
          
        if (fuelSettingsError) {
          throw fuelSettingsError;
        }
        
        // Create a map of fuel type to tank capacity
        const capacityMap: Record<string, number> = {};
        if (fuelSettingsData && fuelSettingsData.length > 0) {
          fuelSettingsData.forEach(setting => {
            capacityMap[setting.fuel_type] = Number(setting.tank_capacity);
          });
        }
        
        // Now get inventory data for current levels
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
                // Use capacity from settings if available, otherwise use default
                capacity: capacityMap[item.fuel_type] || (item.fuel_type === 'Petrol' ? 10000 : 12000),
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

  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      setIsLoadingActivities(true);
      try {
        // Array to hold all activities
        let allActivities: RecentActivity[] = [];
        
        // Fetch recent shifts
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select('id, start_time, staff_id, staff(name)')
          .order('start_time', { ascending: false })
          .limit(3);
          
        if (shiftsError) throw shiftsError;
        
        if (shiftsData && shiftsData.length > 0) {
          const shiftActivities = shiftsData.map(shift => ({
            id: `shift-${shift.id}`,
            time: formatTime(shift.start_time),
            action: `Shift started by ${shift.staff?.name || 'Staff'}`,
            type: 'shift-start'
          }));
          allActivities = [...allActivities, ...shiftActivities];
        }
        
        // Fetch recent tank unloads
        const { data: unloadsData, error: unloadsError } = await supabase
          .from('tank_unloads')
          .select('*')
          .order('date', { ascending: false })
          .limit(3);
          
        if (unloadsError) throw unloadsError;
        
        if (unloadsData && unloadsData.length > 0) {
          const unloadActivities = unloadsData.map(unload => ({
            id: `unload-${unload.id}`,
            time: formatTime(unload.date),
            action: `Tank unload received: ${unload.quantity.toLocaleString()}L ${unload.fuel_type}`,
            type: 'tank-unload'
          }));
          allActivities = [...allActivities, ...unloadActivities];
        }
        
        // Fetch recent transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('id, date, fuel_type, amount, quantity, payment_method, created_at')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (transactionsError) throw transactionsError;
        
        if (transactionsData && transactionsData.length > 0) {
          const transactionActivities = transactionsData.map(transaction => ({
            id: `transaction-${transaction.id}`,
            time: formatTime(transaction.created_at),
            action: transaction.fuel_type === 'PAYMENT' 
              ? `Payment received: ₹${transaction.amount.toLocaleString()}`
              : `${transaction.fuel_type} sales: ${transaction.quantity.toLocaleString()}L for ₹${transaction.amount.toLocaleString()}`,
            type: 'transaction'
          }));
          allActivities = [...allActivities, ...transactionActivities];
        }
        
        // Sort all activities by time (most recent first)
        allActivities.sort((a, b) => {
          // If time contains "ago" format, we need to parse it differently
          const timeA = a.time.includes('ago') ? new Date().getTime() - parseTimeAgo(a.time) : parseDisplayTime(a.time);
          const timeB = b.time.includes('ago') ? new Date().getTime() - parseTimeAgo(b.time) : parseDisplayTime(b.time);
          return timeB - timeA;
        });
        
        // Take the 5 most recent activities
        setRecentActivities(allActivities.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };
    
    fetchRecentActivities();
  }, []);

  // Helper function to format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return 'Unknown';
    
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 2) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Helper function to parse time ago format back to milliseconds
  const parseTimeAgo = (timeAgo: string): number => {
    if (timeAgo.includes('min')) {
      const mins = parseInt(timeAgo);
      return mins * 60 * 1000;
    } else if (timeAgo.includes('hour')) {
      const hours = parseInt(timeAgo);
      return hours * 60 * 60 * 1000;
    } else if (timeAgo === 'Yesterday') {
      return 24 * 60 * 60 * 1000;
    }
    return 0;
  };

  // Helper function to parse display time to timestamp
  const parseDisplayTime = (displayTime: string): number => {
    if (displayTime === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.getTime();
    }
    // For dates like "Mar 15"
    const now = new Date();
    const year = now.getFullYear();
    return new Date(`${displayTime}, ${year}`).getTime();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Home</h2>
        <p className="text-muted-foreground">Quick access to frequent operations</p>
      </div>

      {/* Quick Actions Section - Moved to top */}
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
            title="Stock Levels"
            description="Record end-of-day stock levels"
            icon={<Package size={20} />}
            href="/stock-levels"
          />
          
          <QuickAction
            title="Record Transaction"
            description="Record sales via QR, card, or cash"
            icon={<CreditCard size={20} />}
            href="/record-indent"
          />
          
          <QuickAction
            title="Staff Management"
            description="Record cash provided to staff at shift start"
            icon={<BarChart size={20} />}
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
            href="/dashboard"
          />
        </div>
      </div>

      {/* Fuel Tank Status - Moved below Quick Actions */}
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

      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold">Recent Activity</h3>
        <div className="space-y-4">
          {isLoadingActivities ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading recent activities...</p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No recent activities found</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center rounded-lg border p-3">
                <div className="mr-4 font-medium">{activity.time}</div>
                <div>{activity.action}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
