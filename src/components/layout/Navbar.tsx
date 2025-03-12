
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/use-mobile';
import { LogOut, Menu, X, Home, Fuel, Gauge, Users, ShoppingBag, Clock, Settings, ClipboardEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavbarProps {
  className?: string;
}

const Navbar = ({ className }: NavbarProps) => {
  const { logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Stock Levels', href: '/stock-levels', icon: Gauge },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Staff', href: '/staff-management', icon: Users },
    { name: 'Daily Readings', href: '/daily-readings', icon: ClipboardEdit },
    { name: 'Record Indent', href: '/fueling-process', icon: Fuel },
    { name: 'Shift Management', href: '/shift-management', icon: Clock },
    { name: 'Consumables', href: '/consumables', icon: ShoppingBag },
    { name: 'Testing Details', href: '/testing-details', icon: ClipboardEdit },
    { name: 'Pump Settings', href: '/pump-settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  if (isMobile) {
    return (
      <header className={cn('fixed top-0 left-0 right-0 z-50 bg-white border-b h-14 flex items-center px-4', className)}>
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="flex items-center">
            <span className="font-bold text-lg">Fuel Station</span>
          </Link>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex justify-between items-center px-6 h-14 border-b">
                <span className="font-bold">Fuel Station</span>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-theme(spacing.14))]">
                <nav className="flex flex-col gap-0.5 p-2">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
                <Separator className="my-2" />
                <div className="p-2">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

  return (
    <header className={cn('sticky top-0 z-50 flex h-14 items-center border-b bg-background px-4 lg:px-6', className)}>
      <Link to="/" className="flex items-center">
        <span className="font-bold hidden md:inline-block">Fuel Station Management</span>
        <span className="font-bold md:hidden">Fuel Station</span>
      </Link>
      <nav className="ml-auto flex items-center gap-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline-block">{item.name}</span>
            </Link>
          );
        })}
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden lg:inline-block">Logout</span>
        </Button>
      </nav>
    </header>
  );
};

export default Navbar;
