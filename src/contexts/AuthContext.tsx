
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for current session on initial load
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          handleSession(session);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          handleSession(session);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    initAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session: Session) => {
    const supabaseUser = session.user;
    if (supabaseUser) {
      try {
        // Get the user's profile from the profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (error) throw error;

        const authUser: AuthUser = {
          id: supabaseUser.id,
          username: profile?.username || supabaseUser.email?.split('@')[0] || 'user',
          email: supabaseUser.email || '',
          role: (profile?.role as 'admin' | 'staff') || 'staff'
        };
        
        setUser(authUser);
      } catch (error) {
        console.error('Error getting user profile:', error);
        // Fallback to basic user info
        const authUser: AuthUser = {
          id: supabaseUser.id,
          username: supabaseUser.email?.split('@')[0] || 'user',
          email: supabaseUser.email || '',
          role: 'staff'
        };
        setUser(authUser);
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Try to login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // For development purposes, still check for mock users
        if ((email === 'admin@example.com' && password === 'admin123') || 
            (email === 'staff@example.com' && password === 'staff123')) {
          
          const isMockAdmin = email === 'admin@example.com';
          const mockUser: AuthUser = {
            id: isMockAdmin ? '1' : '2',
            username: isMockAdmin ? 'admin' : 'staff',
            email,
            role: isMockAdmin ? 'admin' : 'staff'
          };
          
          setUser(mockUser);
          toast({
            title: "Login successful (development mode)",
            description: `Welcome back, ${mockUser.username}!`,
          });
          return true;
        }
        
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }

      if (data.session) {
        toast({
          title: "Login successful",
          description: `Welcome back!`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
