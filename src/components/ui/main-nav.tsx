import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSuperAdminAuth } from "@/superadmin/contexts/SuperAdminAuthContext"
import { Logo } from "@/components/ui/logo";

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

export function MainNav({ className, ...props }: MainNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, fuelPumpName } = useAuth()
  const { user: superAdminUser, logout: superAdminLogout } = useSuperAdminAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const mainLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dsr", label: "Daily Sales" },
    { href: "/tank-monitor", label: "Tank Monitor" },
    { href: "/tank-unload", label: "Tank Unload" },
    { href: "/indents", label: "Indents" },
    { href: "/transactions", label: "Transactions" },
    { href: "/customers", label: "Customers" },
  ];

  const superAdminLinks = [
    { href: "/superadmin/dashboard", label: "Dashboard" },
    { href: "/superadmin/fuel-pumps", label: "Fuel Pumps" },
    { href: "/superadmin/staff", label: "Staff" },
    { href: "/superadmin/customers", label: "Customers" },
    { href: "/superadmin/indents", label: "Indents" },
    { href: "/superadmin/transactions", label: "Transactions" },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleSuperAdminLogout = async () => {
    setIsLoggingOut(true)
    try {
      await superAdminLogout()
      navigate("/superadmin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const renderLinks = () => {
    if (superAdminUser) {
      return superAdminLinks.map((link) => (
        <Button
          key={link.href}
          variant="ghost"
          onClick={() => navigate(link.href)}
          className={cn(
            "p-0 font-medium hover:bg-transparent hover:underline underline-offset-4",
            location.pathname === link.href
              ? "text-foreground underline"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Button>
      ))
    } else {
      return mainLinks.map((link) => (
        <Button
          key={link.href}
          variant="ghost"
          onClick={() => navigate(link.href)}
          className={cn(
            "p-0 font-medium hover:bg-transparent hover:underline underline-offset-4",
            location.pathname === link.href
              ? "text-foreground underline"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Button>
      ))
    }
  }

  return (
    <div className={cn("flex items-center justify-between", className)} {...props}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="p-0">
          <Logo size="sm" className="h-9 w-auto" />
        </Button>
        <nav className="hidden md:flex items-center gap-4">{renderLinks()}</nav>
      </div>
      <div className="flex items-center gap-4">
        {user && fuelPumpName && <span className="hidden md:block text-sm text-muted-foreground">Fuel Pump: {fuelPumpName}</span>}
        {superAdminUser && <span className="hidden md:block text-sm text-muted-foreground">Super Admin</span>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/01.png" alt="Avatar" />
                <AvatarFallback>
                  {user ? user?.email?.charAt(0)?.toUpperCase() : superAdminUser?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="grid gap-2 px-2">
              <div className="text-sm font-medium leading-none">
                {user ? user.email : superAdminUser?.email}
              </div>
              <div className="text-xs text-muted-foreground">
                {user ? "Fuel Pump User" : "Super Admin"}
              </div>
            </div>
            <DropdownMenuSeparator />
            {superAdminUser ? (
              <DropdownMenuItem onClick={handleSuperAdminLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
