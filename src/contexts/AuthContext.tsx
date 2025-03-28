
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'super_admin';
  fuelPumpId?: string; // Associated fuel pump ID
  fuelPumpName?: string; // Associated fuel pump name
}

interface Session {
  access_token: string;
  user: UserProfile;
}

interface AuthContextType {
  user: UserProfile | null;
  fuelPumpId: string | null; // Added explicit fuel pump ID
  fuelPumpName?: string | null; // Add fuelPumpName property
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading?: boolean; // Add isLoading property
  login: (userId: string, userData: any, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  fuelPumpId: null, // Default to null
  fuelPumpName: null, // Default to null
  isAuthenticated: false,
  isSuperAdmin: false,
  isAdmin: false,
  isStaff: false,
  isLoading: false, // Default to false
  login: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  const [fuelPumpName, setFuelPumpName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize auth state from localStorage if available
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        // Check if user is authenticated via Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log("Auth initialization - Supabase session:", session ? "Found" : "Not found");
        
        if (session?.user) {
          console.log("Auth initialization - User authenticated via Supabase");
          
          // Extract fuel pump ID from user metadata
          const metadataFuelPumpId = session.user.user_metadata?.fuelPumpId;
          const metadataFuelPumpName = session.user.user_metadata?.fuelPumpName;
          
          if (metadataFuelPumpId) {
            console.log(`Auth initialization - Fuel pump ID from metadata: ${metadataFuelPumpId}`);
            setFuelPumpId(metadataFuelPumpId);
          }
          
          if (metadataFuelPumpName) {
            console.log(`Auth initialization - Fuel pump name from metadata: ${metadataFuelPumpName}`);
            setFuelPumpName(metadataFuelPumpName);
          }
          
          // Check if we have stored user data
          const storedSession = localStorage.getItem('fuel_pro_session');
          if (storedSession) {
            try {
              const parsedSession = JSON.parse(storedSession);
              
              if (parsedSession.user) {
                console.log("Auth initialization - Using stored user data");
                
                setUser(parsedSession.user);
                
                // If no fuel pump ID from metadata, try from stored session
                if (!metadataFuelPumpId && parsedSession.user.fuelPumpId) {
                  console.log(`Auth initialization - Fuel pump ID from storage: ${parsedSession.user.fuelPumpId}`);
                  setFuelPumpId(parsedSession.user.fuelPumpId);
                }
                
                // If no fuel pump name from metadata, try from stored session
                if (!metadataFuelPumpName && parsedSession.user.fuelPumpName) {
                  console.log(`Auth initialization - Fuel pump name from storage: ${parsedSession.user.fuelPumpName}`);
                  setFuelPumpName(parsedSession.user.fuelPumpName);
                }
                
                setIsLoading(false);
                return; // Exit early if we restored from storage
              }
            } catch (error) {
              console.error("Error parsing stored session:", error);
            }
          }
          
          // If we couldn't restore from storage, create minimal user object
          const userProfile: UserProfile = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'staff',
            fuelPumpId: metadataFuelPumpId,
            fuelPumpName: metadataFuelPumpName,
          };
          
          setUser(userProfile);
          
          // Store for future use
          localStorage.setItem('fuel_pro_session', JSON.stringify({ user: userProfile }));
        } else {
          console.log("Auth initialization - No authenticated session found");
          // Check if we have stored session
          const storedSession = localStorage.getItem('fuel_pro_session');
          
          if (storedSession) {
            console.log("Auth initialization - Found stored session, checking if valid");
            
            try {
              const parsedSession = JSON.parse(storedSession);
              
              if (parsedSession.user) {
                console.log("Auth initialization - Has stored user, attempting to restore session");
                
                // Try to restore Supabase session before using stored data
                const { data, error } = await supabase.auth.refreshSession();
                
                if (!error && data.session) {
                  console.log("Auth initialization - Successfully refreshed Supabase session");
                  
                  setUser(parsedSession.user);
                  setFuelPumpId(parsedSession.user.fuelPumpId || null);
                  setFuelPumpName(parsedSession.user.fuelPumpName || null);
                } else {
                  console.log("Auth initialization - Failed to refresh session, clearing stored data");
                  localStorage.removeItem('fuel_pro_session');
                  setUser(null);
                  setFuelPumpId(null);
                  setFuelPumpName(null);
                }
              }
            } catch (error) {
              console.error("Error parsing stored session:", error);
              localStorage.removeItem('fuel_pro_session');
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state changed: ${event}`);
        
        if (event === 'SIGNED_IN' && session) {
          console.log("User signed in");
          
          const metadataFuelPumpId = session.user.user_metadata?.fuelPumpId;
          const metadataFuelPumpName = session.user.user_metadata?.fuelPumpName;
          
          const userProfile: UserProfile = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'staff',
            fuelPumpId: metadataFuelPumpId,
            fuelPumpName: metadataFuelPumpName,
          };
          
          setUser(userProfile);
          setFuelPumpId(metadataFuelPumpId || null);
          setFuelPumpName(metadataFuelPumpName || null);
          
          // Store for future use
          localStorage.setItem('fuel_pro_session', JSON.stringify({ user: userProfile }));
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          localStorage.removeItem('fuel_pro_session');
          setUser(null);
          setFuelPumpId(null);
          setFuelPumpName(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const login = async (userId: string, userData: any, rememberMe: boolean = false): Promise<boolean> => {
    try {
      if (!userData) {
        console.error("Login failed: No user data provided");
        return false;
      }
      
      console.log("Login - Received user data:", userData);
      
      // Always include the default fuel pump ID if none provided
      if (!userData.fuelPumpId) {
        console.log("Login - No fuel pump ID provided, using default");
        userData.fuelPumpId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
      }
      
      setUser(userData);
      setFuelPumpId(userData.fuelPumpId || null);
      
      // Store in local storage for persistence
      if (rememberMe) {
        console.log("Login - Storing session with 'remember me'");
        localStorage.setItem('fuel_pro_session', JSON.stringify({ user: userData }));
      } else {
        console.log("Login - Storing session without 'remember me'");
        // Still store the session, but with a session cookie
        localStorage.setItem('fuel_pro_session', JSON.stringify({ user: userData }));
      }
      
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('fuel_pro_session');
      setUser(null);
      setFuelPumpId(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Derive authentication status and roles from user object
  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isStaff = user?.role === 'staff' || isAdmin;
  
  const value = {
    user,
    fuelPumpId, // Expose fuel pump ID directly
    fuelPumpName, // Expose fuel pump name
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isLoading, // Expose loading state
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
