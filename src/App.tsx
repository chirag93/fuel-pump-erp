
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DailyReadings from './pages/DailyReadings';
import StockLevels from './pages/StockLevels';
import AllTransactions from './pages/AllTransactions';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected route component that uses the AuthContext
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/daily-readings" element={
            <ProtectedRoute>
              <Layout>
                <DailyReadings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/stock-levels" element={
            <ProtectedRoute>
              <Layout>
                <StockLevels />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/all-transactions" element={
            <ProtectedRoute>
              <Layout>
                <AllTransactions />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
