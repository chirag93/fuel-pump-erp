
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthRequired from "@/components/auth/ProtectedRoute";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Indents from "./pages/Indents";
import Layout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AllTransactions from './pages/AllTransactions';
import Transactions from './pages/Transactions';
import ShiftManagement from './pages/ShiftManagement';
import MobileShiftManagement from './pages/mobile/MobileShiftManagement';

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
        <Layout>{/*@ts-ignore*/}
          <Dashboard />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/customers",
    element: (
      <AuthRequired>
        <Layout>{/*@ts-ignore*/}
          <Customers />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/transactions",
    element: (
      <AuthRequired>
        <Layout>{/*@ts-ignore*/}
          <Transactions />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/indents",
    element: (
      <AuthRequired>
        <Layout>{/*@ts-ignore*/}
          <Indents />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/all-transactions",
    element: (
      <AuthRequired>
        <Layout>{/*@ts-ignore*/}
          <AllTransactions />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/shift-management",
    element: (
      <AuthRequired>
        <Layout>{/*@ts-ignore*/}
          <ShiftManagement />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/mobile/shift-management",
    element: (
      <AuthRequired>
        <MobileShiftManagement />
      </AuthRequired>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
