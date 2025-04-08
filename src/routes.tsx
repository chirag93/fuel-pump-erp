
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthRequired from "@/components/auth/AuthRequired";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Indents from "./pages/Indents";
import Layout from "@/components/layout/Layout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AllTransactions from './pages/AllTransactions';
import Transactions from './pages/Transactions';
import ShiftManagement from './pages/ShiftManagement';
import MobileShiftManagement from './pages/mobile/MobileShiftManagement';
import MobileCustomers from './pages/mobile/MobileCustomers';
import MobileCustomerDetails from './pages/mobile/MobileCustomerDetails';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Define routes
const routes = [
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthRequired>
        <Layout>
          <Dashboard />
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
    path: "/transactions",
    element: (
      <AuthRequired>
        <Layout>
          <Transactions />
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
    path: "/all-transactions",
    element: (
      <AuthRequired>
        <Layout>
          <AllTransactions />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/shift-management",
    element: (
      <AuthRequired>
        <Layout>
          <ShiftManagement />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/mobile/shift-management",
    element: (
      <ProtectedRoute>
        <MobileShiftManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/mobile/customers",
    element: (
      <ProtectedRoute>
        <MobileCustomers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/mobile/customers/:id",
    element: (
      <ProtectedRoute>
        <MobileCustomerDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
