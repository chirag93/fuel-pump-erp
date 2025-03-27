import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBasket,
  TrendingUp,
  Truck,
  Users,
  X,
  User,
  DollarSign,
  Receipt,
  Calculator,
  FileSpreadsheet,
  DownloadCloud,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Auto-expand accounting section if on an accounting page
  useEffect(() => {
    if (location.pathname.includes('/accounting')) {
      setAccountingOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const mainNavigation = [
    { href: "/home", icon: <Home className="h-4 w-4" />, label: "Home" },
    { href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
    { href: "/customers", icon: <Users className="h-4 w-4" />, label: "Customers" },
    { href: "/record-indent", icon: <CreditCard className="h-4 w-4" />, label: "Record Indent" },
    { href: "/all-transactions", icon: <TrendingUp className="h-4 w-4" />, label: "All Transactions" },
    { href: "/shift-management", icon: <BarChart3 className="h-4 w-4" />, label: "Shift Management" },
    { href: "/daily-readings", icon: <FileText className="h-4 w-4" />, label: "Daily Readings" },
    { href: "/staff-management", icon: <Users className="h-4 w-4" />, label: "Staff Management" },
    { href: "/stock-levels", icon: <Layers className="h-4 w-4" />, label: "Stock Levels" },
    { href: "/tank-unload", icon: <Truck className="h-4 w-4" />, label: "Tank Unload" },
    { href: "/consumables", icon: <Package className="h-4 w-4" />, label: "Consumables" },
    { href: "/approval-requests", icon: <AlertTriangle className="h-4 w-4" />, label: "Approval Requests" },
  ];

  const accountingNavigation = [
    { href: "/accounting", icon: <DollarSign className="h-4 w-4" />, label: "Financial Reports" },
    { href: "/accounting/reconciliation", icon: <Calculator className="h-4 w-4" />, label: "Reconciliation" },
    { href: "/accounting/invoices", icon: <Receipt className="h-4 w-4" />, label: "Invoice Processing" },
    { href: "/accounting/tax", icon: <FileSpreadsheet className="h-4 w-4" />, label: "Tax Calculation" },
    { href: "/accounting/export", icon: <DownloadCloud className="h-4 w-4" />, label: "Export Data" },
    { href: "/accounting/expense-categories", icon: <FileText className="h-4 w-4" />, label: "Expense Categories" },
  ];

  const settingsNavigation = [
    { href: "/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
  ];

  // Function to derive initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for larger screens */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-muted bg-background transition-transform md:flex",
          isCollapsed && "w-16"
        )}
      >
        <div className="flex h-16 items-center px-4">
          <Link to="/dashboard" className="font-semibold text-2xl flex items-center gap-2">
            <Home className="h-6 w-6" />
            <span className={cn("transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
              Fuel Pro 360
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto md:hidden"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <nav className="grid items-start gap-2">
            {/* Main Navigation Items */}
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className={cn("transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
                  {item.label}
                </span>
              </Link>
            ))}

            {/* Accounting Section (Collapsible) */}
            <Collapsible
              open={accountingOpen}
              onOpenChange={setAccountingOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    location.pathname.includes('/accounting') ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4" />
                    <span className={cn("transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
                      Accounting
                    </span>
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        accountingOpen ? "rotate-180" : "rotate-0"
                      )}
                    />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-6 pt-1">
                  {accountingNavigation.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.icon}
                      <span className={cn("transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Settings Navigation */}
            {settingsNavigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className={cn("transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className={cn("flex flex-1 flex-col", !isCollapsed ? "md:pl-64" : "md:pl-16")}>
        {/* Top navigation for mobile and user controls */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6 md:px-6">
          <Button
            type="button"
            variant="ghost"
            className="mr-2 md:hidden"
            onClick={toggleMobileMenu}
          >
            {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="font-semibold text-2xl">
            {mainNavigation.find((item) => item.href === location.pathname)?.label || 
             accountingNavigation.find((item) => item.href === location.pathname)?.label || 
             settingsNavigation.find((item) => item.href === location.pathname)?.label || 
             "Dashboard"}
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* User dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full" 
                  aria-label="User menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.username ? getInitials(user.username) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive" 
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile sidebar */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <aside className="flex h-full w-64 flex-col border-r border-muted bg-background">
              <div className="flex h-16 items-center px-4">
                <Link to="/dashboard" className="font-semibold text-2xl flex items-center gap-2">
                  <Home className="h-6 w-6" />
                  Fuel Pro 360
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={toggleMobileMenu}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-4">
                <nav className="grid items-start gap-2">
                  {/* Main Navigation Items */}
                  {mainNavigation.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      )}
                      onClick={toggleMobileMenu}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  {/* Accounting Section for Mobile */}
                  <Collapsible
                    open={accountingOpen}
                    onOpenChange={setAccountingOpen}
                    className="w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                          location.pathname.includes('/accounting') ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4" />
                          <span>Accounting</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            accountingOpen ? "rotate-180" : "rotate-0"
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-6 pt-1">
                        {accountingNavigation.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                              location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                            onClick={toggleMobileMenu}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Settings Navigation */}
                  {settingsNavigation.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      )}
                      onClick={toggleMobileMenu}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
