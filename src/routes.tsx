import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AuthRequired from "./components/AuthRequired";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Indents from "./pages/Indents";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Reconciliation from "./pages/Reconciliation";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import SuperAdminDashboard from "./superadmin/pages/SuperAdminDashboard";
import SuperAdminLayout from "./superadmin/components/SuperAdminLayout";
import SuperAdminLogin from "./superadmin/pages/SuperAdminLogin";
import SuperAdminNotFound from "./superadmin/pages/SuperAdminNotFound";
import SuperAdminPricing from "./superadmin/pages/SuperAdminPricing";
import SuperAdminProfile from "./superadmin/pages/SuperAdminProfile";
import SuperAdminRegister from "./superadmin/pages/SuperAdminRegister";
import SuperAdminSettings from "./superadmin/pages/SuperAdminSettings";
import SuperAdminCustomers from "./superadmin/pages/SuperAdminCustomers";
import Transactions from "./pages/Transactions";
import SuperAdminTransactions from "./superadmin/pages/SuperAdminTransactions";
import AllTransactions from './pages/AllTransactions';

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
    path: "/register",
    element: <Register />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
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
    path: "/reconciliation",
    element: (
      <AuthRequired>
        <Layout>
          <Reconciliation />
        </Layout>
      </AuthRequired>
    ),
  },
  {
    path: "/profile",
    element: (
      <AuthRequired>
        <Layout>
          <Profile />
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
    path: "/superadmin",
    element: <SuperAdminLayout />,
    children: [
      {
        path: "login",
        element: <SuperAdminLogin />,
      },
      {
        path: "register",
        element: <SuperAdminRegister />,
      },
      {
        path: "pricing",
        element: <SuperAdminPricing />,
      },
      {
        path: "dashboard",
        element: (
          <AuthRequired superAdmin={true}>
            <SuperAdminDashboard />
          </AuthRequired>
        ),
      },
      {
        path: "customers",
        element: (
          <AuthRequired superAdmin={true}>
            <SuperAdminCustomers />
          </AuthRequired>
        ),
      },
      {
        path: "transactions",
        element: (
          <AuthRequired superAdmin={true}>
            <SuperAdminTransactions />
          </AuthRequired>
        ),
      },
      {
        path: "profile",
        element: (
          <AuthRequired superAdmin={true}>
            <SuperAdminProfile />
          </AuthRequired>
        ),
      },
      {
        path: "settings",
        element: (
          <AuthRequired superAdmin={true}>
            <SuperAdminSettings />
          </AuthRequired>
        ),
      },
      {
        path: "*",
        element: <SuperAdminNotFound />,
      },
    ],
  },
  {
    path: "/all-transactions",
    element: <AuthRequired><AllTransactions /></AuthRequired>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
