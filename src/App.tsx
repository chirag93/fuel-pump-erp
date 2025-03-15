
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import DailyReadings from '@/pages/DailyReadings';
import StockLevels from '@/pages/StockLevels';
import TestingDetails from '@/pages/TestingDetails';
import ShiftManagement from '@/pages/ShiftManagement';
import StaffManagement from '@/pages/StaffManagement';
import Customers from '@/pages/Customers';
import CustomerDetails from '@/pages/CustomerDetails';
import AllTransactions from '@/pages/AllTransactions';
import Consumables from '@/pages/Consumables';
import FuelPumpSettings from '@/pages/FuelPumpSettings';
import TankUnload from '@/pages/TankUnload';
import RecordIndent from '@/pages/RecordIndent';
import BookletIndents from './pages/BookletIndents';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "/", element: <Index /> },
      { path: "/home", element: <Home /> },
      { path: "/dashboard", element: <ProtectedRoute children={<Dashboard />} /> },
      { path: "/readings", element: <ProtectedRoute children={<DailyReadings />} /> },
      { path: "/stock", element: <ProtectedRoute children={<StockLevels />} /> },
      { path: "/testing", element: <ProtectedRoute children={<TestingDetails />} /> },
      { path: "/shifts", element: <ProtectedRoute children={<ShiftManagement />} /> },
      { path: "/staff", element: <ProtectedRoute children={<StaffManagement />} /> },
      { path: "/customers", element: <ProtectedRoute children={<Customers />} /> },
      { path: "/customer/:id", element: <ProtectedRoute children={<CustomerDetails />} /> },
      { path: "/customer/:customerId/booklet/:bookletId/indents", element: <ProtectedRoute children={<BookletIndents />} /> },
      { path: "/transactions", element: <ProtectedRoute children={<AllTransactions />} /> },
      { path: "/consumables", element: <ProtectedRoute children={<Consumables />} /> },
      { path: "/settings/pumps", element: <ProtectedRoute children={<FuelPumpSettings />} /> },
      { path: "/tank-unload", element: <ProtectedRoute children={<TankUnload />} /> },
      { path: "/indent", element: <ProtectedRoute children={<RecordIndent />} /> },
      { path: "/login", element: <Login /> },
      { path: "*", element: <NotFound /> }
    ]
  }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
