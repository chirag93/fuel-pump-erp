
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
          <AllTransactions />
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
    element: <AuthRequired><AllTransactions /></AuthRequired>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
