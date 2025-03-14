
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DailyReadings from './pages/DailyReadings';
import StockLevels from './pages/StockLevels';
import AllTransactions from './pages/AllTransactions';
import { AuthProvider } from './contexts/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/daily-readings" element={<Layout><DailyReadings /></Layout>} />
          <Route path="/stock-levels" element={<Layout><StockLevels /></Layout>} />
          <Route path="/all-transactions" element={<Layout><AllTransactions /></Layout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
