
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { superAdminApi } from '../api/superAdminApi';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminUser {
  id: string;
  email: string;
  username: string;
}

interface SuperAdminAuthContextType {
  user: SuperAdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | null>(null);

export const useSuperAdminAuth = () => {
  const context = useContext(SuperAdminAuthContext);
  if (!context) {
    throw new Error('useSuperAdminAuth must be used within a SuperAdminAuthProvider');
  }
  return context;
};

export const SuperAdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if there's a stored session for super admin
    const checkStoredSession = async () => {
      try {
        const storedSession = localStorage.getItem('super_admin_session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          // Validate the session with the server
          const isValid = await superAdminApi.checkSuperAdminAccess(sessionData.user.id);
          
          if (isValid) {
            setUser(sessionData.user);
            setIsAuthenticated(true);
          } else {
            // Invalid or expired session
            localStorage.removeItem('super_admin_session');
          }
        }
      } catch (error) {
        console.error('Error checking stored session:', error);
        localStorage.removeItem('super_admin_session');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStoredSession();
  }, []);
  
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Use Supabase auth to verify credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.user) {
        throw new Error('Authentication failed');
      }
      
      // Check if this user is a super admin
      const isAdmin = await superAdminApi.checkSuperAdminAccess(data.user.id);
      
      if (!isAdmin) {
        // Sign out since they don't have admin access
        await supabase.auth.signOut();
        throw new Error('You do not have Super Admin access');
      }
      
      // Create super admin user object
      const superAdminUser: SuperAdminUser = {
        id: data.user.id,
        email: data.user.email || email,
        username: email.split('@')[0]
      };
      
      // Store session if rememberMe is true
      if (rememberMe) {
        localStorage.setItem('super_admin_session', JSON.stringify({
          user: superAdminUser,
          accessToken: data.session?.access_token
        }));
      }
      
      // Update state
      setUser(superAdminUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${superAdminUser.username}!`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Super admin login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      // Clear local storage
      localStorage.removeItem('super_admin_session');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out of Super Admin.",
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
    <SuperAdminAuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
};
