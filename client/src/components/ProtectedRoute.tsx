import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;