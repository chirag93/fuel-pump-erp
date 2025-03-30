import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFuelPumpId } from '@/integrations/utils';

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
  fuelPumpName: string | null; // Add fuelPumpName property
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (userId: string, userData: any, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshFuelPumpId: () => Promise<string | null>; // New method to refresh fuel pump ID
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  fuelPumpId: null,
  fuelPumpName: null,
  isAuthenticated: false,
  isSuperAdmin: false,
  isAdmin: false,
  isStaff: false,
  isLoading: false,
  login: async () => false,
  logout: async () => {},
  refreshFuelPumpId: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  const [fuelPumpName, setFuelPumpName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Method to refresh fuel pump ID from backend
  const refreshFuelPumpId = async (): Promise<string | null> => {
    try {
      console.log('AuthContext: Refreshing fuel pump ID...');
      
      // Check if user is authenticated via Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('AuthContext: No authenticated session found during refresh');
        return null;
      }
      
      // Check if we already have the fuel pump ID in user metadata
      if (session.user.user_metadata?.fuelPumpId) {
        console.log(`AuthContext: Already have fuel pump ID in metadata: ${session.user.user_metadata.fuelPumpId}`);
        
        // Verify this ID exists in database
        const { data: verifyPump } = await supabase
          .from('fuel_pumps')
          .select('id, name')
          .eq('id', session.user.user_metadata.fuelPumpId)
          .single();
        
      if (verifyPump) {
        console.log(`AuthContext: Verified fuel pump ID exists: ${verifyPump.id}`);
        setFuelPumpId(verifyPump.id);
        setFuelPumpName(verifyPump.name);
        return verifyPump.id;
      } else {
        console.log(`AuthContext: Fuel pump ID ${session.user.user_metadata.fuelPumpId} from metadata does not exist in database, will try other methods`);
      }
    }
    
    // Try to find fuel pump ID using email lookup for admins
    const { data: fuelPumpData } = await supabase
      .from('fuel_pumps')
      .select('id, name')
      .eq('email', session.user.email)
      .maybeSingle();
    
    if (fuelPumpData) {
      console.log(`AuthContext: Found pump by email match: ${fuelPumpData.id}`);
      setFuelPumpId(fuelPumpData.id);
      setFuelPumpName(fuelPumpData.name);
      
      // Update user metadata
      await supabase.auth.updateUser({
        data: { 
          fuelPumpId: fuelPumpData.id,
          fuelPumpName: fuelPumpData.name,
          role: 'admin'
        }
      });
      
      // Update local storage
      updateLocalStorage(fuelPumpData.id, fuelPumpData.name, 'admin');
      
      return fuelPumpData.id;
    }
    
    // If not found as admin, check if this user is in the staff table
    // Try first by email
    const { data: staffData } = await supabase
      .from('staff')
      .select('fuel_pump_id, role')
      .eq('email', session.user.email)
      .maybeSingle();
    
    if (staffData?.fuel_pump_id) {
      console.log(`AuthContext: Found fuel pump ID via staff email: ${staffData.fuel_pump_id}`);
      
      // Get fuel pump name
      const { data: pumpData } = await supabase
        .from('fuel_pumps')
        .select('name')
        .eq('id', staffData.fuel_pump_id)
        .single();
      
      if (pumpData) {
        setFuelPumpId(staffData.fuel_pump_id);
        setFuelPumpName(pumpData.name);
        
        // Update user metadata
        await supabase.auth.updateUser({
          data: { 
            fuelPumpId: staffData.fuel_pump_id,
            fuelPumpName: pumpData.name,
            role: staffData.role || 'staff'
          }
        });
        
        // Update local storage
        updateLocalStorage(staffData.fuel_pump_id, pumpData.name, staffData.role || 'staff');
        
        return staffData.fuel_pump_id;
      }
    }
    
    // If not found by email, try by auth_id
    const { data: staffByAuthData } = await supabase
      .from('staff')
      .select('fuel_pump_id, role')
      .eq('auth_id', session.user.id)
      .maybeSingle();
    
    if (staffByAuthData?.fuel_pump_id) {
      console.log(`AuthContext: Found fuel pump ID via staff auth_id: ${staffByAuthData.fuel_pump_id}`);
      
      // Get fuel pump name
      const { data: pumpData } = await supabase
        .from('fuel_pumps')
        .select('name')
        .eq('id', staffByAuthData.fuel_pump_id)
        .single();
      
      if (pumpData) {
        setFuelPumpId(staffByAuthData.fuel_pump_id);
        setFuelPumpName(pumpData.name);
        
        // Update user metadata
        await supabase.auth.updateUser({
          data: { 
            fuelPumpId: staffByAuthData.fuel_pump_id,
            fuelPumpName: pumpData.name,
            role: staffByAuthData.role || 'staff'
          }
        });
        
        // Update local storage
        updateLocalStorage(staffByAuthData.fuel_pump_id, pumpData.name, staffByAuthData.role || 'staff');
        
        return staffByAuthData.fuel_pump_id;
      }
    }
    
    // Try to get from database using other methods
    const freshFuelPumpId = await getFuelPumpId();
    
    if (freshFuelPumpId) {
      console.log(`AuthContext: Retrieved fresh fuel pump ID: ${freshFuelPumpId}`);
      
      // Update state
      setFuelPumpId(freshFuelPumpId);
      
      // Get fuel pump name
      const { data: fuelPumpData } = await supabase
        .from('fuel_pumps')
        .select('name')
        .eq('id', freshFuelPumpId)
        .single();
      
      if (fuelPumpData) {
        setFuelPumpName(fuelPumpData.name);
        console.log(`AuthContext: Retrieved fuel pump name: ${fuelPumpData.name}`);
      }
      
      // Update user metadata with this pump ID for future use
      await supabase.auth.updateUser({
        data: { 
          fuelPumpId: freshFuelPumpId,
          fuelPumpName: fuelPumpData?.name
        }
      });
      
      // Update local storage
      updateLocalStorage(freshFuelPumpId, fuelPumpData?.name, session.user.user_metadata?.role || 'staff');
      
      return freshFuelPumpId;
    }
    
    console.log('AuthContext: Could not find fuel pump ID for user. Returning null.');
    return null;
  } catch (error) {
    console.error('Error refreshing fuel pump ID:', error);
    return null;
  }
};

// Helper function to update localStorage
const updateLocalStorage = (fuelPumpId: string, fuelPumpName: string | undefined, role: string) => {
  try {
    const storedSession = localStorage.getItem('fuel_pro_session');
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      if (parsedSession.user) {
        parsedSession.user.fuelPumpId = fuelPumpId;
        parsedSession.user.fuelPumpName = fuelPumpName;
        parsedSession.user.role = role;
        localStorage.setItem('fuel_pro_session', JSON.stringify(parsedSession));
        console.log('Updated local storage with fuel pump data');
      }
    }
  } catch (parseError) {
    console.error('Error updating stored session:', parseError);
  }
};
  
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
          
          // If we don't have a fuel pump ID yet, try to get it from the backend
          if (!metadataFuelPumpId) {
            console.log("Auth initialization - No fuel pump ID in metadata, trying to fetch from backend");
            await refreshFuelPumpId();
          }
        } else {
          console.log("Auth initialization - No authenticated session found");
          setUser(null);
          setFuelPumpId(null);
          setFuelPumpName(null);
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
      async (event, session) => {
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
          
          // If we don't have a fuel pump ID, try to get it
          if (!metadataFuelPumpId) {
            // Use setTimeout to avoid deadlock with auth state change
            setTimeout(async () => {
              await refreshFuelPumpId();
            }, 0);
          }
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
      
      // Validate fuel pump ID if provided
      if (userData.fuelPumpId) {
        console.log(`Login - Validating fuel pump ID: ${userData.fuelPumpId}`);
        
        const { data: fuelPump } = await supabase
          .from('fuel_pumps')
          .select('id, name')
          .eq('id', userData.fuelPumpId)
          .maybeSingle();
          
        if (fuelPump) {
          console.log(`Login - Verified fuel pump exists: ${fuelPump.name}`);
          userData.fuelPumpName = fuelPump.name;
        } else {
          console.warn(`Login - Provided fuel pump ID not found: ${userData.fuelPumpId}`);
          userData.fuelPumpId = null;
          userData.fuelPumpName = null;
        }
      }
      
      setUser(userData);
      setFuelPumpId(userData.fuelPumpId || null);
      setFuelPumpName(userData.fuelPumpName || null);
      
      // If we don't have a fuel pump ID, try to get it
      if (!userData.fuelPumpId) {
        await refreshFuelPumpId();
      }
      
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
      setFuelPumpName(null);
      
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
    fuelPumpId,
    fuelPumpName,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isLoading,
    login,
    logout,
    refreshFuelPumpId
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
