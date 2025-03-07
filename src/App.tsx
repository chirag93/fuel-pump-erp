
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
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFuelPumps from "./pages/admin/AdminFuelPumps";
import AdminCreatePump from "./pages/admin/AdminCreatePump";
import AdminPumpDetail from "./pages/admin/AdminPumpDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Regular User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/home" element={<Home />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/consumables" element={<Consumables />} />
              <Route path="/shift" element={<ShiftManagement />} />
              <Route path="/fueling" element={<FuelingProcess />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/fuel-pumps" element={<AdminFuelPumps />} />
              <Route path="/admin/fuel-pumps/create" element={<AdminCreatePump />} />
              <Route path="/admin/fuel-pumps/:id" element={<AdminPumpDetail />} />
            </Route>
            
            <Route path="/landing" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
