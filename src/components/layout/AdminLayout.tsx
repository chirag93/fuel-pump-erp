
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard,
  Fuel,
  Users,
  LogOut,
  Menu,
  X,
  UserCircle,
  PlusCircle,
  Settings
} from 'lucide-react';

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

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/admin/dashboard' },
    { icon: <Fuel size={20} />, label: 'Fuel Pumps', to: '/admin/fuel-pumps' },
    { icon: <PlusCircle size={20} />, label: 'Create Pump', to: '/admin/fuel-pumps/create' },
    { icon: <Settings size={20} />, label: 'Settings', to: '/admin/settings' },
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
          <h2 className="text-xl font-bold">Admin Portal</h2>
        </div>
        
        <div className="flex flex-col gap-1 p-4">
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
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <UserCircle />
            </div>
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
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

export default AdminLayout;
