import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Helper to sync user to backend
    const syncUser = async (user: User | null) => {
      if (!user) return;
      try {
        const response = await fetch('/api/user/sync', {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({ id: user.id, email: user.email }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || error.error || 'Request failed');
        }
        console.log('User synced to backend:', user.id);
      } catch (err) {
        // Log error but don't block UI
        console.error('Failed to sync user to backend', err);
      }
    };

    let mounted = true;

    const getSession = async () => {
      try {
        console.log('Getting initial session...');

        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 5000));

        const {
          data: { session },
          error,
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

        if (error) {
          console.error('Session fetch error:', error);
        } else {
          console.log('Initial session:', session ? 'Found' : 'None');
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
      if (session?.user) {
        syncUser(session.user);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
      if (session?.user) {
        syncUser(session.user);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    session,
    user,
    signOut: () => supabase.auth.signOut(),
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-600">Loading FinSync...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
