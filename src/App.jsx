import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import DashboardPage from './dashboard/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { useSession } from './hooks/useSession';

function App() {
  const { session, loading } = useSession();

  if (loading) {
    return <div>Loading application...</div>; // Or a global spinner
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Add other protected routes here */}
            </Route>

            {/* Default route */}
            {/* If logged in, redirect to dashboard, else to login */}
            <Route
              path="/"
              element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
            />

            {/* Fallback for unmatched routes (optional) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
