import { lazy } from "react";

import { Layout } from "@/components/layout";
import { RequireAuth } from "@/components/auth/require-auth";

const Home = lazy(() => import("./pages/Home"));
const Indents = lazy(() => import("./pages/Indents"));
const Customers = lazy(() => import("./pages/Customers"));
const Settings = lazy(() => import("./pages/Settings"));
const Consumables = lazy(() => import("./pages/Consumables"));
const FuelInventory = lazy(() => import("./pages/FuelInventory"));
const TankUnloads = lazy(() => import("./pages/TankUnloads"));
const FuelTests = lazy(() => import("./pages/FuelTests"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const AccountingDashboard = lazy(() => import("./pages/accounting/AccountingDashboard"));
const CustomerPayments = lazy(() => import("./pages/CustomerPayments"));

// Import the DailySalesReport component
import DailySalesReport from './pages/DailySalesReport';
import FinancialReports from './pages/accounting/FinancialReports';

export const routes = [
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout>
          <Home />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/indents",
    element: (
      <RequireAuth>
        <Layout>
          <Indents />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/customers",
    element: (
      <RequireAuth>
        <Layout>
          <Customers />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/settings",
    element: (
      <RequireAuth>
        <Layout>
          <Settings />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/consumables",
    element: (
      <RequireAuth>
        <Layout>
          <Consumables />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/fuel-inventory",
    element: (
      <RequireAuth>
        <Layout>
          <FuelInventory />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/tank-unloads",
    element: (
      <RequireAuth>
        <Layout>
          <TankUnloads />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/fuel-tests",
    element: (
      <RequireAuth>
        <Layout>
          <FuelTests />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/staff-management",
    element: (
      <RequireAuth>
        <Layout>
          <StaffManagement />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/accounting",
    element: (
      <RequireAuth>
        <Layout>
          <AccountingDashboard />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/customer-payments",
    element: (
      <RequireAuth>
        <Layout>
          <CustomerPayments />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/daily-sales-report",
    element: (
      <RequireAuth>
        <Layout>
          <DailySalesReport />
        </Layout>
      </RequireAuth>
    ),
  },
  {
    path: "/accounting/financial-reports",
    element: (
      <RequireAuth>
        <Layout>
          <FinancialReports />
        </Layout>
      </RequireAuth>
    ),
  },
];
