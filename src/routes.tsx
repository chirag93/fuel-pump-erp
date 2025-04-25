
import { lazy } from "react";

import { Layout } from "@/components/layout/Layout";
import { AuthRequired } from "@/components/auth-required";

const Home = lazy(() => import("./pages/Home"));
const Indents = lazy(() => import("./pages/Indents"));
const Customers = lazy(() => import("./pages/Customers"));
const Settings = lazy(() => import("./pages/FuelPumpSettings"));
const Consumables = lazy(() => import("./pages/Consumables"));
const FuelInventory = lazy(() => import("./pages/StockLevels"));
const TankUnloads = lazy(() => import("./pages/TankUnload"));
const FuelTests = lazy(() => import("./pages/FuelTests"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const AccountingDashboard = lazy(() => import("./pages/accounting/FinancialReports"));
const CustomerPayments = lazy(() => import("./pages/Customers"));

// Import the DailySalesReport component
import DailySalesReport from './pages/DailySalesReport';
import FinancialReports from './pages/accounting/FinancialReports';

export const routes = [
  {
    path: "/",
    element: (
      <AuthRequired>
        <Layout>
          <Home />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/indents",
    element: (
      <AuthRequired>
        <Layout>
          <Indents />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/customers",
    element: (
      <AuthRequired>
        <Layout>
          <Customers />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/settings",
    element: (
      <AuthRequired>
        <Layout>
          <Settings />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/consumables",
    element: (
      <AuthRequired>
        <Layout>
          <Consumables />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/fuel-inventory",
    element: (
      <AuthRequired>
        <Layout>
          <FuelInventory />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/tank-unloads",
    element: (
      <AuthRequired>
        <Layout>
          <TankUnloads />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/fuel-tests",
    element: (
      <AuthRequired>
        <Layout>
          <FuelTests />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/staff-management",
    element: (
      <AuthRequired>
        <Layout>
          <StaffManagement />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/accounting",
    element: (
      <AuthRequired>
        <Layout>
          <AccountingDashboard />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/customer-payments",
    element: (
      <AuthRequired>
        <Layout>
          <CustomerPayments />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/daily-sales-report",
    element: (
      <AuthRequired>
        <Layout>
          <DailySalesReport />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/accounting/financial-reports",
    element: (
      <AuthRequired>
        <Layout>
          <FinancialReports />
        </Layout>
      </AuthRequired>
    ),
  },
];
