
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { 
  BarChart4, 
  Home, 
  Users, 
  Package, 
  ClipboardList, 
  LogOut,
  Menu,
  X,
  Droplets,
  UserCircle,
  Settings,
  CalendarClock,
  Fuel,
  Truck,
  Camera
} from 'lucide-react';

type StaffFeature = Database['public']['Enums']['staff_feature'];

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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  to: string;
  feature: StaffFeature | null; // null means always visible (like Home)
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userFeatures, setUserFeatures] = useState<StaffFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define all navigation items with their required permissions
  const allNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Home', to: '/', feature: null }, // Always visible
    { icon: <BarChart4 size={20} />, label: 'Dashboard', to: '/dashboard', feature: 'dashboard' },
    { icon: <CalendarClock size={20} />, label: 'Daily Sales Record (DSR)', to: '/daily-readings', feature: 'daily_readings' },
    { icon: <Droplets size={20} />, label: 'Stock Levels', to: '/stock-levels', feature: 'stock_levels' },
    { icon: <Truck size={20} />, label: 'Tank Unload', to: '/tank-unload', feature: 'tank_unload' },
    { icon: <Users size={20} />, label: 'Customers', to: '/customers', feature: 'customers' },
    { icon: <Users size={20} />, label: 'Staff', to: '/staff-management', feature: 'staff_management' },
    { icon: <Fuel size={20} />, label: 'Record Indent', to: '/record-indent', feature: 'record_indent' },
    { icon: <ClipboardList size={20} />, label: 'Shift Management', to: '/shift-management', feature: 'shift_management' },
    { icon: <Package size={20} />, label: 'Consumables', to: '/consumables', feature: 'consumables' },
    { icon: <Camera size={20} />, label: 'Testing', to: '/testing-details', feature: 'testing' },
    { icon: <Settings size={20} />, label: 'Settings', to: '/settings', feature: 'settings' },
  ];

  useEffect(() => {
    if (user) {
      fetchUserFeatures();
    }
  }, [user]);

  const fetchUserFeatures = async () => {
    setIsLoading(true);
    
    try {
      // Super admins and admins have access to everything - extract all available features
      if (user?.role === 'super_admin' || user?.role === 'admin') {
        const allFeatures = allNavItems
          .filter(item => item.feature !== null)
          .map(item => item.feature) as StaffFeature[];
        
        console.log('Admin/Super admin has all features:', allFeatures);
        setUserFeatures(allFeatures);
        setIsLoading(false);
        return;
      }
      
      // For staff members, fetch their permissions
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_id', user?.id)
        .maybeSingle();
      
      if (staffError || !staffData) {
        console.error('Error fetching staff record:', staffError);
        setIsLoading(false);
        return;
      }
      
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('staff_permissions')
        .select('feature')
        .eq('staff_id', staffData.id);
      
      if (permissionsError) {
        console.error('Error fetching staff permissions:', permissionsError);
        setIsLoading(false);
        return;
      }
      
      const features = permissionsData.map(p => p.feature);
      console.log('Staff has features:', features);
      setUserFeatures(features);
    } catch (error) {
      console.error('Error fetching user features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Filter navigation items based on user permissions
  const visibleNavItems = allNavItems.filter(item => 
    // Always show items with null feature (like Home)
    item.feature === null || 
    // For admins and super admins, show all items
    user?.role === 'super_admin' || 
    user?.role === 'admin' ||
    // For staff, show only items they have permission for
    userFeatures.includes(item.feature as StaffFeature)
  );

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
            <Droplets className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Fuel Master</h2>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 p-4 h-[calc(100vh-64px-80px)] overflow-y-auto">
          {isLoading ? (
            // Show loading skeleton when fetching permissions
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded-md"></div>
              ))}
            </div>
          ) : (
            // Show filtered navigation items
            visibleNavItems.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                active={pathname === item.to}
              />
            ))
          )}
        </div>
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <UserCircle />
            </div>
            <div>
              <p className="font-medium">{user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</p>
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

export default DashboardLayout;
