
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "@/components/layout/Layout"
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Staff from './pages/Staff';
import Customers from './pages/Customers';
import RecordIndent from './pages/RecordIndent';
import FuelTests from './pages/FuelTests';
import DailyReadings from './pages/DailyReadings';
import FuelSettings from './pages/FuelSettings';
import PumpSettings from './pages/PumpSettings';
import BusinessSettings from './pages/BusinessSettings';
import Shifts from './pages/Shifts';
import StockLevels from './pages/StockLevels';
import Vehicles from './pages/Vehicles';
import IndentBooklets from './pages/IndentBooklets';
import Transactions from './pages/Transactions';
import { supabase } from './integrations/supabase/client';
import AllTransactions from './pages/AllTransactions';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })
  }, [])

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <Layout>
                <Staff />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/record-indent"
          element={
            <ProtectedRoute>
              <Layout>
                <RecordIndent />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-tests"
          element={
            <ProtectedRoute>
              <Layout>
                <FuelTests />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-readings"
          element={
            <ProtectedRoute>
              <Layout>
                <DailyReadings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-settings"
          element={
            <ProtectedRoute>
              <Layout>
                <FuelSettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pump-settings"
          element={
            <ProtectedRoute>
              <Layout>
                <PumpSettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/business-settings"
          element={
            <ProtectedRoute>
              <Layout>
                <BusinessSettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute>
              <Layout>
                <Shifts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-levels"
          element={
            <ProtectedRoute>
              <Layout>
                <StockLevels />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <Layout>
                <Vehicles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/indent-booklets"
          element={
            <ProtectedRoute>
              <Layout>
                <IndentBooklets />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <Transactions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/all-transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <AllTransactions />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
