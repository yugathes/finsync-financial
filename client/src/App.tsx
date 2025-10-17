import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { AuthProvider } from './auth/AuthProvider';
import { useSession } from './hooks/useSession';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import DashboardPage from './pages/Dashboard';
import GroupsPage from './pages/GroupsPage';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session } = useSession();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
          </Route>

          {/* Default route */}
          <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

          {/* Original routes */}
          <Route path="/index" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
