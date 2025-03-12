
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import StaffManagement from "./pages/StaffManagement";
import StockLevels from "./pages/StockLevels";
import FuelPumpSettings from "./pages/FuelPumpSettings";
import ShiftManagement from "./pages/ShiftManagement";
import DailyReadings from "./pages/DailyReadings";
import TestingDetails from "./pages/TestingDetails";
import RecordIndent from "./pages/RecordIndent";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  function ProtectedRoute({ children }: { children: JSX.Element }) {
    if (!session) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Add root route that redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <StockLevels />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <FuelPumpSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shifts"
            element={
              <ProtectedRoute>
                <ShiftManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/readings"
            element={
              <ProtectedRoute>
                <DailyReadings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fuel-tests"
            element={
              <ProtectedRoute>
                <TestingDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/record-indent"
            element={
              <ProtectedRoute>
                <RecordIndent />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
