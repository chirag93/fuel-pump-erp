
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session ? mapUserToProfile(session.user) : null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session ? mapUserToProfile(session.user) : null);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Helper function to map Supabase user to our UserProfile format
  const mapUserToProfile = (supabaseUser: User): UserProfile => {
    return {
      id: supabaseUser.id,
      username: supabaseUser.email?.split('@')[0] || 'user',
      email: supabaseUser.email || '',
      // Default to 'staff' role - this would ideally come from a profiles table
      role: (supabaseUser.app_metadata.role as 'admin' | 'staff') || 'staff'
    };
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // If rememberMe is true, update the session expiry time
        if (rememberMe) {
          // We can use refreshSession instead of setSession to create a new session with a longer expiry
          // This is a workaround as setSession with expires_in doesn't work properly with TypeScript
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Session refresh error:', refreshError);
          }
        }
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.email?.split('@')[0] || 'user'}!`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading, session }}>
      {children}
    </AuthContext.Provider>
  );
};
