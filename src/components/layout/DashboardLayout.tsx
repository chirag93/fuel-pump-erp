
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
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
  Camera,
  Calculator,
  FileText,
  FileSpreadsheet,
  Receipt,
  DollarSign,
  Percent,
  Search,
  Upload,
  Download,
  List,
  Folder,
  CreditCard
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from '@/hooks/use-mobile';

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

interface SubmenuItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
}

const SubmenuItem = ({ icon, label, to, active }: SubmenuItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 ml-6 text-sm transition-all ${
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

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if current path is under accounting to auto-expand the menu
    if (pathname.startsWith('/accounting')) {
      setAccountingOpen(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Full navigation items for desktop
  const desktopNavItems = [
    { icon: <Home size={20} />, label: 'Home', to: '/home' },
    { icon: <BarChart4 size={20} />, label: 'Dashboard', to: '/dashboard' },
    { icon: <CalendarClock size={20} />, label: 'Daily Sales Record (DSR)', to: '/daily-readings' },
    { icon: <Droplets size={20} />, label: 'Stock Levels', to: '/stock-levels' },
    { icon: <Truck size={20} />, label: 'Tank Unload', to: '/tank-unload' },
    { icon: <Users size={20} />, label: 'Customers', to: '/customers' },
    { icon: <Users size={20} />, label: 'Staff', to: '/staff-management' },
    { icon: <Fuel size={20} />, label: 'Record Indent', to: '/record-indent' },
    { icon: <ClipboardList size={20} />, label: 'Shift Management', to: '/shift-management' },
    { icon: <Package size={20} />, label: 'Consumables', to: '/consumables' },
    { icon: <Settings size={20} />, label: 'Settings', to: '/settings' },
  ];

  // Mobile navigation items (only 4 options)
  const mobileNavItems = [
    { icon: <CreditCard size={20} />, label: 'Record Indent', to: '/record-indent' },
    { icon: <CalendarClock size={20} />, label: 'Shift Management', to: '/shift-management' },
    { icon: <Users size={20} />, label: 'Customers', to: '/customers' },
    { icon: <Droplets size={20} />, label: 'Daily Readings', to: '/daily-readings' },
  ];

  // Use mobile nav items if on mobile, otherwise use desktop nav items
  const navItems = isMobile ? mobileNavItems : desktopNavItems;

  // Accounting submenu items
  const accountingItems = [
    { icon: <FileText size={18} />, label: 'Financial Reports', to: '/accounting/financial-reports' },
    { icon: <Percent size={18} />, label: 'Tax Calculation', to: '/accounting/tax-calculation' },
    { icon: <FileSpreadsheet size={18} />, label: 'Export Data', to: '/accounting/export-data' },
    { icon: <Receipt size={18} />, label: 'Invoice Processing', to: '/accounting/invoice-processing' },
    { icon: <Search size={18} />, label: 'Reconciliation', to: '/accounting/reconciliation' },
    { icon: <Folder size={18} />, label: 'Expense Categories', to: '/accounting/expense-categories' }
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
            <Droplets className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Fuel Pro 360</h2>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 p-4 h-[calc(100vh-64px-80px)] overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              active={pathname === item.to}
            />
          ))}

          {/* Only show Accounting section on desktop */}
          {!isMobile && (
            <Collapsible
              open={accountingOpen}
              onOpenChange={setAccountingOpen}
              className="w-full"
            >
              <CollapsibleTrigger className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all
                ${pathname.startsWith('/accounting') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}>
                <Calculator size={20} />
                <span className="flex-1 text-left">Accounting</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${
                    accountingOpen ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                {accountingItems.map((item) => (
                  <SubmenuItem
                    key={item.to}
                    icon={item.icon}
                    label={item.label}
                    to={item.to}
                    active={pathname === item.to}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
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
