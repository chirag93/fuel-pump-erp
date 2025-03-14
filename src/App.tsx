
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DailyReadings from './pages/DailyReadings';
import Customers from './pages/Customers';
import RecordIndent from './pages/RecordIndent';
import StockLevels from './pages/StockLevels';
import AllTransactions from './pages/AllTransactions';
import { supabase } from './integrations/supabase/client';

// Create a Layout component since we can't import it
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container mx-auto px-4">
      {children}
    </div>
  );
};

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
