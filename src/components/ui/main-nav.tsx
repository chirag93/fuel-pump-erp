import {
  AlignJustify,
  BarChart,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LucideIcon,
  Settings,
  ShoppingCart,
  User,
  Users,
} from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface MainNavItem {
  title: string
  href: string
  description?: string
  disabled?: boolean
  external?: boolean
  icon?: LucideIcon
  children?: MainNavItem[]
}

export const mainNavItems: MainNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Overview of your account",
    icon: LayoutDashboard,
  },
  {
    title: "Indents",
    href: "/indents",
    description: "Manage customer indents",
    icon: ListChecks,
  },
  {
    title: "Transactions",
    href: "/transactions",
    description: "View and manage transactions",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    href: "/customers",
    description: "Manage customer accounts",
    icon: Users,
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    description: "Manage customer vehicles",
    icon: Car,
  },
  {
    title: "Accounting",
    href: "#",
    description: "Manage accounting settings",
    icon: CircleDollarSign,
    children: [
      {
        title: "Financial Reports",
        href: "/accounting/financial-reports",
        description: "Generate financial reports",
      },
      {
        title: "Consumables",
        href: "/accounting/consumables",
        description: "Manage consumables",
      },
      {
        title: "Customer Payments",
        href: "/accounting/customer-payments",
        description: "Record customer payments",
      },
    ],
  },
  {
    title: "Inventory",
    href: "#",
    description: "Manage inventory settings",
    icon: Gauge,
    children: [
      {
        title: "Fuel Stock",
        href: "/inventory/fuel-stock",
        description: "Manage fuel stock levels",
      },
      {
        title: "Tank Unloads",
        href: "/inventory/tank-unloads",
        description: "Manage tank unloads",
      },
      {
        title: "Daily Readings",
        href: "/inventory/daily-readings",
        description: "Manage daily readings",
      },
    ],
  },
  {
    title: "Settings",
    href: "#",
    description: "Manage settings",
    icon: Settings,
    children: [
      {
        title: "Fuel Settings",
        href: "/settings/fuel-settings",
        description: "Manage fuel settings",
      },
      {
        title: "Pump Settings",
        href: "/settings/pump-settings",
        description: "Manage pump settings",
      },
      {
        title: "Business Settings",
        href: "/settings/business-settings",
        description: "Manage business settings",
      },
      {
        title: "Staff Management",
        href: "/settings/staff-management",
        description: "Manage staff accounts",
      },
    ],
  },
  {
    title: "Reports",
    href: "#",
    children: [
      {
        title: "Daily Sales Report",
        href: "/daily-sales-report",
        description: "View detailed daily sales reports",
      },
      {
        title: "Financial Reports",
        href: "/accounting/financial-reports",
        description: "Generate comprehensive financial reports",
      }
    ]
  },
]

interface MainNavProps {
  items?: MainNavItem[]
  children?: React.ReactNode
  className?: string
}

export function MainNav({ items, children, className }: MainNavProps) {
  return (
    <div className={cn("flex gap-6 md:gap-10", className)}>
      {items?.length ? (
        <nav className="flex items-center space-x-6">
          {items?.map(
            (item, index) =>
              item.href ? (
                <a
                  className="flex items-center text-sm font-medium transition-colors hover:text-foreground"
                  href={item.href}
                  key={index}
                >
                  {item.title}
                </a>
              ) : (
                <span
                  className="flex items-center text-sm font-medium text-muted-foreground"
                  key={index}
                >
                  {item.title}
                </span>
              )
          )}
        </nav>
      ) : null}
      {children}
    </div>
  )
}

interface MobileNavProps {
  items?: MainNavItem[]
  children?: React.ReactNode
  className?: string
}

export function MobileNav({ items, children, className }: MobileNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-0">
          <AlignJustify className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <div className="grid gap-2">
          {items?.length ? (
            <>
              {items?.map((item, i) =>
                item.children ? (
                  <MobileNavItemWithChildren key={i} item={item} />
                ) : (
                  <DropdownMenuItem key={i} onClick={() => {}}>
                    <a href={item.href} className="w-full">
                      {item.title}
                    </a>
                  </DropdownMenuItem>
                )
              )}
              {items?.length ? <DropdownMenuSeparator /> : null}
            </>
          ) : null}
          {children}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface MobileNavItemWithChildrenProps {
  item: MainNavItem
}

function MobileNavItemWithChildren({ item }: MobileNavItemWithChildrenProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={item.title}>
        <AccordionTrigger className="flex items-center justify-between py-1.5 text-sm font-medium">
          {item.title}
          <ChevronDown className="h-4 w-4" />
        </AccordionTrigger>
        <AccordionContent className="space-y-1">
          {item.children?.map((child, j) => (
            <DropdownMenuItem key={j} onClick={() => {}}>
              <a href={child.href} className="w-full">
                {child.title}
              </a>
            </DropdownMenuItem>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
