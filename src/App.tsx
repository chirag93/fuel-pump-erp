
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
      { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: "/readings", element: <ProtectedRoute><DailyReadings /></ProtectedRoute> },
      { path: "/stock", element: <ProtectedRoute><StockLevels /></ProtectedRoute> },
      { path: "/testing", element: <ProtectedRoute><TestingDetails /></ProtectedRoute> },
      { path: "/shifts", element: <ProtectedRoute><ShiftManagement /></ProtectedRoute> },
      { path: "/staff", element: <ProtectedRoute><StaffManagement /></ProtectedRoute> },
      { path: "/customers", element: <ProtectedRoute><Customers /></ProtectedRoute> },
      { path: "/customer/:id", element: <ProtectedRoute><CustomerDetails /></ProtectedRoute> },
      { path: "/customer/:customerId/booklet/:bookletId/indents", element: <ProtectedRoute><BookletIndents /></ProtectedRoute> },
      { path: "/transactions", element: <ProtectedRoute><AllTransactions /></ProtectedRoute> },
      { path: "/consumables", element: <ProtectedRoute><Consumables /></ProtectedRoute> },
      { path: "/settings/pumps", element: <ProtectedRoute><FuelPumpSettings /></ProtectedRoute> },
      { path: "/tank-unload", element: <ProtectedRoute><TankUnload /></ProtectedRoute> },
      { path: "/indent", element: <ProtectedRoute><RecordIndent /></ProtectedRoute> },
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
