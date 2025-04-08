
import React from 'react';
import { Navigate } from 'react-router-dom';

const Transactions = () => {
  // This component now redirects to the AllTransactions page
  return <Navigate to="/all-transactions" replace />;
};

export default Transactions;
