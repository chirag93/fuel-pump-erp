
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Customers from "./pages/Customers";
import StaffManagement from "./pages/StaffManagement";
import Consumables from "./pages/Consumables";
import ShiftManagement from "./pages/ShiftManagement";
import FuelingProcess from "./pages/FuelingProcess";
import StockLevels from "./pages/StockLevels";
import TestingDetails from "./pages/TestingDetails";
import CustomerDetails from "./pages/CustomerDetails";
import DailyReadings from "./pages/DailyReadings";
import FuelPumpSettings from "./pages/FuelPumpSettings";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
              <Route path="/home" element={<DashboardLayout><Home /></DashboardLayout>} />
              <Route path="/customers" element={<DashboardLayout><Customers /></DashboardLayout>} />
              <Route path="/customer/:id" element={<DashboardLayout><CustomerDetails /></DashboardLayout>} />
              <Route path="/staff" element={<DashboardLayout><StaffManagement /></DashboardLayout>} />
              <Route path="/consumables" element={<DashboardLayout><Consumables /></DashboardLayout>} />
              <Route path="/shift" element={<DashboardLayout><ShiftManagement /></DashboardLayout>} />
              <Route path="/daily-readings" element={<DashboardLayout><DailyReadings /></DashboardLayout>} />
              <Route path="/fueling" element={<DashboardLayout><FuelingProcess /></DashboardLayout>} />
              <Route path="/inventory" element={<DashboardLayout><StockLevels /></DashboardLayout>} />
              <Route path="/testing" element={<DashboardLayout><TestingDetails /></DashboardLayout>} />
              <Route path="/settings" element={<DashboardLayout><FuelPumpSettings /></DashboardLayout>} />
            </Route>
            <Route path="/landing" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
