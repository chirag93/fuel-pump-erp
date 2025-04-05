import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Droplets,
  FileText,
  Package,
  Truck,
  CreditCard,
  ClipboardList,
  Wrench,
  BarChart,
} from 'lucide-react';
import FuelTankDisplay from '@/components/fuel/FuelTankDisplay';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFuelPumpId } from '@/integrations/utils';
import { toast } from '@/components/ui/use-toast';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

interface FuelLevel {
  fuelType: string;
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
  const { fuelPumpName } = useAuth();
  const [fuelLevels, setFuelLevels] = useState<FuelLevel[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingFuelLevels, setIsLoadingFuelLevels] = useState(true);

  // Fetch fuel levels from the database with tank capacities from settings
  useEffect(() => {
    const fetchFuelLevels = async () => {
      try {
        setIsLoadingFuelLevels(true);
        console.log('Fetching fuel settings and levels for Home page');
        
        // Get the current fuel pump ID
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.log('No fuel pump ID available');
          toast({
            title: "Authentication Required",
            description: "Please log in with a fuel pump account to view fuel settings",
            variant: "destructive"
          });
          setIsLoadingFuelLevels(false);
          return;
        }
        
        console.log(`Fetching fuel data for fuel pump ID: ${fuelPumpId}`);
        
        // First, get the fuel settings to get tank capacities and current levels
        const { data: fuelSettingsData, error: fuelSettingsError } = await supabase
          .from('fuel_settings')
          .select('fuel_type, tank_capacity, current_level, updated_at')
          .eq('fuel_pump_id', fuelPumpId);
          
        if (fuelSettingsError) {
          console.error('Error fetching fuel settings:', fuelSettingsError);
          throw fuelSettingsError;
        }
        
        console.log('Fuel settings data:', fuelSettingsData);
        
        if (fuelSettingsData && fuelSettingsData.length > 0) {
          // Format the data for our component directly from fuel_settings
          const fuelData = fuelSettingsData.map(item => ({
            fuelType: item.fuel_type,
            lastUpdated: item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'Unknown'
          }));
          
          console.log('Processed fuel data from settings:', fuelData);
          
          if (fuelData.length > 0) {
            setFuelLevels(fuelData);
            setIsLoadingFuelLevels(false);
            return; // Exit early if we have good data from settings
          }
        }
        
        // Fallback to inventory if no fuel_settings data
        console.log('No fuel settings data, falling back to inventory');
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('fuel_pump_id', fuelPumpId)
          .order('date', { ascending: false });
          
        if (error) {
          console.error('Error fetching inventory:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Group the latest entries by fuel type
          const latestByFuelType: Record<string, any> = {};
          data.forEach(item => {
            if (!latestByFuelType[item.fuel_type] || new Date(item.date) > new Date(latestByFuelType[item.fuel_type].date)) {
              latestByFuelType[item.fuel_type] = item;
            }
          });
          
          console.log('Latest by fuel type from inventory:', latestByFuelType);
          
          // Format the data for our component
          const fuelData = Object.values(latestByFuelType).map(item => {
            // Ensure we have a valid fuel_type before using it
            if (item && typeof item.fuel_type === 'string') {
              return {
                fuelType: item.fuel_type,
                lastUpdated: item.date ? new Date(item.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Unknown'
              }
            }
            return null;
          }).filter(Boolean) as FuelLevel[];
          
          console.log('Processed fuel data from inventory:', fuelData);
          
          if (fuelData.length > 0) {
            setFuelLevels(fuelData);
          }
        }
      } catch (error) {
        console.error('Error fetching fuel levels:', error);
      } finally {
        setIsLoadingFuelLevels(false);
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
  const parseTimeAgo = (timeString: string): number => {
    if (timeString.includes('min')) {
      const mins = parseInt(timeString);
      return mins * 60 * 1000;
    } else if (timeString.includes('hour')) {
      const hours = parseInt(timeString);
      return hours * 60 * 60 * 1000;
    } else if (timeString === 'Yesterday') {
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
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {fuelPumpName ? `${fuelPumpName} Dashboard` : 'Fuel Pro 360 Dashboard'}
          </h2>
          <p className="text-muted-foreground">Quick access to frequent operations</p>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <QuickAction
              title="Daily Sales Record"
              description="Add shift-wise opening and closing readings"
              icon={<Droplets size={20} />}
              href="/dsr"
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

        <div>
          <h3 className="mb-4 text-xl font-semibold">Fuel Storage Status</h3>
          {isLoadingFuelLevels ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading fuel storage data...</p>
            </div>
          ) : fuelLevels.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No fuel storage data available</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {fuelLevels.map((fuel, index) => (
                <FuelTankDisplay 
                  key={index}
                  fuelType={fuel.fuelType} 
                  lastUpdated={fuel.lastUpdated}
                  showTankIcon={true}
                />
              ))}
            </div>
          )}
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
    </DashboardLayout>
  );
};

export default Home;
