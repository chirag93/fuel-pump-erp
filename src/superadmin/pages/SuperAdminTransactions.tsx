
import React from 'react';
import { Navigate } from 'react-router-dom';

const SuperAdminTransactions = () => {
  // Redirect to the AllTransactions page
  return <Navigate to="/all-transactions" replace />;
};

export default SuperAdminTransactions;
