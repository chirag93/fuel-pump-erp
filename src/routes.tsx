import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Shell } from "@/components/ui/shell";
import { AuthRequired } from "@/components/auth-required";
import { SuperAdminRequired } from "@/components/superadmin/super-admin-required";
import SuperAdminLayout from "@/superadmin/layouts/SuperAdminLayout";
import SuperAdminDashboard from "@/superadmin/pages/SuperAdminDashboard";
import SuperAdminFuelPumps from "@/superadmin/pages/SuperAdminFuelPumps";
import SuperAdminStaff from "@/superadmin/pages/SuperAdminStaff";
import SuperAdminCustomers from "@/superadmin/pages/SuperAdminCustomers";
import SuperAdminIndents from "@/superadmin/pages/SuperAdminIndents";
import SuperAdminTransactions from "@/superadmin/pages/SuperAdminTransactions";
import SuperAdminSettings from "@/superadmin/pages/SuperAdminSettings";
import TankMonitor from "@/pages/TankMonitor";

const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DailySalesReport = lazy(() => import("@/pages/DailySalesReport"));
const TankUnload = lazy(() => import("@/pages/TankUnload"));
const Indents = lazy(() => import("@/pages/Indents"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Customers = lazy(() => import("@/pages/Customers"));
const Settings = lazy(() => import("@/pages/FuelPumpSettings"));
const Staff = lazy(() => import("@/pages/Staff"));
const MobileRecordIndent = lazy(() => import("@/pages/mobile/MobileRecordIndent"));
const FuelTests = lazy(() => import("@/pages/FuelTests"));

export const routes: RouteObject[] = [
  {
    path: "/auth",
    element: (
      <AuthLayout>
        <Shell />
      </AuthLayout>
    ),
    children: [
      {
        path: "sign-in",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <SignIn />
          </Suspense>
        ),
      },
      {
        path: "sign-up",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <SignUp />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <Dashboard />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "dashboard",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <Dashboard />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "dsr",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <DailySalesReport />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "tank-monitor",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <TankMonitor />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "tank-unload",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <TankUnload />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "indents",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <Indents />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "transactions",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <Transactions />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "customers",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <Customers />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "settings",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <Settings />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "staff",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <Staff />
            </Suspense>
          </AuthRequired>
        ),
      },
      {
        path: "fuel-tests",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <FuelTests />
            </Suspense>
          </AuthRequired>
        ),
      },
    ],
  },
  {
    path: "/mobile",
    element: <Shell />,
    children: [
      {
        path: "record-indent",
        element: (
          <AuthRequired>
            <Suspense fallback={<>Loading...</>}>
              <MobileRecordIndent />
            </Suspense>
          </AuthRequired>
        ),
      },
    ],
  },
  {
    path: "/superadmin",
    element: (
      <SuperAdminRequired>
        <SuperAdminLayout />
      </SuperAdminRequired>
    ),
    children: [
      {
        index: true,
        element: <SuperAdminDashboard />,
      },
      {
        path: "dashboard",
        element: <SuperAdminDashboard />,
      },
      {
        path: "fuel-pumps",
        element: <SuperAdminFuelPumps />,
      },
      {
        path: "staff",
        element: <SuperAdminStaff />,
      },
      {
        path: "customers",
        element: <SuperAdminCustomers />,
      },
      {
        path: "indents",
        element: <SuperAdminIndents />,
      },
      {
        path: "transactions",
        element: <SuperAdminTransactions />,
      },
      {
        path: "settings",
        element: <SuperAdminSettings />,
      },
    ],
  },
];
