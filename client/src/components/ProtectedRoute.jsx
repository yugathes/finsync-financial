import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

const ProtectedRoute = () => {
  const { session, loading } = useSession();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
