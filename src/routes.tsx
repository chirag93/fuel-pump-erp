
import { lazy } from "react";
import { Outlet } from "react-router-dom";
import { AuthRequired } from "@/components/auth-required";
import MainLayout from "@/layouts/MainLayout";

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
        <MainLayout>
          <Outlet />
        </MainLayout>
      </AuthRequired>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "indents", element: <Indents /> },
      { path: "customers", element: <Customers /> },
      { path: "settings", element: <Settings /> },
      { path: "consumables", element: <Consumables /> },
      { path: "fuel-inventory", element: <FuelInventory /> },
      { path: "tank-unloads", element: <TankUnloads /> },
      { path: "fuel-tests", element: <FuelTests /> },
      { path: "staff-management", element: <StaffManagement /> },
      { path: "accounting", element: <AccountingDashboard /> },
      { path: "customer-payments", element: <CustomerPayments /> },
      { path: "daily-sales-report", element: <DailySalesReport /> },
      { path: "accounting/financial-reports", element: <FinancialReports /> },
    ]
  }
];
