
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
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
