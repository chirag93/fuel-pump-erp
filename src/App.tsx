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
import Staff from "./pages/Staff";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Shifts from "./pages/Shifts";
import Readings from "./pages/Readings";
import FuelTests from "./pages/FuelTests";
import RecordIndent from "./pages/RecordIndent";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./layouts/DashboardLayout";

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
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Customers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CustomerDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Staff />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Inventory />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Shifts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/readings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Readings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-tests"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <FuelTests />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/record-indent"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RecordIndent />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
