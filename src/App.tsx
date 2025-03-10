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
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/home" element={<Home />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customer/:id" element={<CustomerDetails />} />
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/consumables" element={<Consumables />} />
              <Route path="/shift" element={<ShiftManagement />} />
              <Route path="/daily-readings" element={<DailyReadings />} />
              <Route path="/fueling" element={<FuelingProcess />} />
              <Route path="/inventory" element={<StockLevels />} />
              <Route path="/testing" element={<TestingDetails />} />
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
