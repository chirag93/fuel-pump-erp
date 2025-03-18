
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FuelPump } from '@/integrations/supabase/client';
import { 
  BarChart4, 
  Home, 
  LogOut,
  Menu,
  X,
  Shield,
  UserCircle,
  Settings,
  PlusCircle,
  Fuel,
  List,
  LinkIcon,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
}

const SidebarItem = ({ icon, label, to, active }: SidebarItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
      active 
        ? 'bg-primary text-primary-foreground' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [linkedPumps, setLinkedPumps] = useState<FuelPump[]>([]);
  const [pumpCount, setPumpCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLinkedPumps = async () => {
    try {
      setIsRefreshing(true);

      // First try to get pumps created by the current user
      let { data, error, count } = await supabase
        .from('fuel_pumps')
        .select('*', { count: 'exact' });
      
      if (error) {
        console.error('Error fetching fuel pumps:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch fuel pumps',
          variant: 'destructive',
        });
        return;
      }
      
      if (data) {
        setLinkedPumps(data);
        setPumpCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchLinkedPumps:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLinkedPumps();
  }, [user?.id]);

  const handleRefresh = async () => {
    await fetchLinkedPumps();
    toast({
      title: 'Refreshed',
      description: 'Linked pumps list has been updated',
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/super-admin/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', to: '/super-admin/dashboard' },
    { icon: <PlusCircle size={20} />, label: 'Provision Pump', to: '/super-admin/provision' },
    { icon: <Fuel size={20} />, label: 'Fuel Pumps', to: '/super-admin/pumps' },
    { icon: <BarChart4 size={20} />, label: 'Analytics', to: '/super-admin/analytics' },
    { icon: <Settings size={20} />, label: 'Settings', to: '/super-admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <button
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 z-30 w-64 border-r bg-card transition-transform duration-200 md:translate-x-0`}
      >
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Super Admin</h2>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 p-4 h-[calc(100vh-64px-80px-100px)] overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              active={pathname === item.to}
            />
          ))}
        </div>
        
        {/* Linked Pumps Section */}
        <div className="border-t border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LinkIcon size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Fuel Pumps</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pumpCount}</Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw 
                  size={14} 
                  className={`text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} 
                />
              </Button>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {linkedPumps.length > 0 ? (
              <ul className="text-xs space-y-1">
                {linkedPumps.map((pump) => (
                  <li key={pump.id} className="text-muted-foreground flex items-center gap-1 py-1">
                    <Fuel size={12} />
                    <span className="truncate">{pump.name}</span>
                    <Badge 
                      variant={pump.status === 'active' ? 'default' : 'secondary'} 
                      className="ml-auto text-[10px] py-0 h-4"
                    >
                      {pump.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">No fuel pumps available</p>
            )}
          </div>
        </div>
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <UserCircle />
            </div>
            <div>
              <p className="font-medium">{user?.username || 'Super Admin'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Super Admin'}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 md:ml-64">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
