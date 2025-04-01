
import { lazy, Suspense } from "react";
import { RouteObject, Outlet } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SuperAdminProtectedRoute from "@/components/auth/SuperAdminProtectedRoute";
import TankMonitor from "@/pages/TankMonitor";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import Shell from "@/components/ui/shell";
import AuthRequired from "@/components/auth-required";
import SuperAdminDashboard from "@/superadmin/pages/SuperAdminDashboard";
import Indents from "@/pages/Indents";
import Staff from "@/pages/Staff";
import Transactions from "@/pages/Transactions";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import DailySalesReport from "@/pages/DailySalesReport";
import FuelTests from "@/pages/FuelTests";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DailySalesRecord = lazy(() => import("@/pages/DailySalesRecord"));
const TankUnload = lazy(() => import("@/pages/TankUnload"));
const AllTransactions = lazy(() => import("@/pages/AllTransactions"));
const Customers = lazy(() => import("@/pages/Customers"));
const FuelPumpSettings = lazy(() => import("@/pages/FuelPumpSettings"));
const StaffManagement = lazy(() => import("@/pages/StaffManagement"));
const MobileRecordIndent = lazy(() => import("@/pages/mobile/MobileRecordIndent"));
const Login = lazy(() => import("@/pages/Login"));
const SuperAdminLogin = lazy(() => import("@/pages/SuperAdminLogin"));
const Index = lazy(() => import("@/pages/Index"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout><Index /></MainLayout>,
  },
  {
    path: "/login",
    element: (
      <AuthLayout>
        <Suspense fallback={<>Loading...</>}>
          <Login />
        </Suspense>
      </AuthLayout>
    ),
  },
  {
    path: "/signin",
    element: (
      <AuthLayout>
        <SignIn />
      </AuthLayout>
    ),
  },
  {
    path: "/signup",
    element: (
      <AuthLayout>
        <SignUp />
      </AuthLayout>
    ),
  },
  {
    path: "/super-admin/login",
    element: (
      <AuthLayout>
        <Suspense fallback={<>Loading...</>}>
          <SuperAdminLogin />
        </Suspense>
      </AuthLayout>
    ),
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<>Loading...</>}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "dsr",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <DailySalesRecord />
          </Suspense>
        ),
      },
      {
        path: "daily-sales-report",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <DailySalesReport />
          </Suspense>
        ),
      },
      {
        path: "tank-monitor",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <TankMonitor />
          </Suspense>
        ),
      },
      {
        path: "tank-unload",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <TankUnload />
          </Suspense>
        ),
      },
      {
        path: "all-transactions",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <AllTransactions />
          </Suspense>
        ),
      },
      {
        path: "transactions",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <Transactions />
          </Suspense>
        ),
      },
      {
        path: "customers",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <Customers />
          </Suspense>
        ),
      },
      {
        path: "staff",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <Staff />
          </Suspense>
        ),
      },
      {
        path: "indents",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <Indents />
          </Suspense>
        ),
      },
      {
        path: "fuel-tests",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <FuelTests />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <FuelPumpSettings />
          </Suspense>
        ),
      },
      {
        path: "staff-management",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <StaffManagement />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/mobile",
    element: <Layout>
      <Outlet />
    </Layout>,
    children: [
      {
        path: "record-indent",
        element: (
          <Suspense fallback={<>Loading...</>}>
            <MobileRecordIndent />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/super-admin",
    element: <SuperAdminProtectedRoute />,
    children: [
      {
        index: true,
        element: <SuperAdminDashboard />,
      },
      {
        path: "dashboard",
        element: <SuperAdminDashboard />,
      },
    ],
  },
];
