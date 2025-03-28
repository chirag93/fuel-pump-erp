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
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  fuelPumpId: string | null;
  fuelPumpName: string | null;
  login: (userId: string, userData: any, rememberMe?: boolean) => Promise<boolean>;
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

// Helper function to get stored session from localStorage
const getStoredSession = (): Session | null => {
  const storedSession = localStorage.getItem('fuel_pro_session');
  if (storedSession) {
    try {
      return JSON.parse(storedSession);
    } catch (e) {
      console.error('Error parsing stored session:', e);
      localStorage.removeItem('fuel_pro_session');
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(getStoredSession());
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  const [fuelPumpName, setFuelPumpName] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a stored session
    const storedSession = getStoredSession();
    
    if (storedSession) {
      console.log('Found stored session:', storedSession);
      setSession(storedSession);
      setUser(storedSession.user);
      
      // Set role states
      setIsSuperAdmin(storedSession.user.role === 'super_admin');
      setIsAdmin(storedSession.user.role === 'admin');
      setIsStaff(storedSession.user.role === 'staff');
      
      // Set fuel pump ID and name from stored session
      if (storedSession.user.fuelPumpId) {
        console.log(`Setting fuel pump ID from stored session: ${storedSession.user.fuelPumpId}`);
        setFuelPumpId(storedSession.user.fuelPumpId);
        setFuelPumpName(storedSession.user.fuelPumpName || null);
      } else {
        // If not a super admin and no fuel pump ID in session, fetch it
        if (storedSession.user.role !== 'super_admin') {
          fetchAssociatedFuelPump(storedSession.user.email);
        }
      }
    } else {
      console.log('No stored session found');
    }
    
    setIsLoading(false);
  }, []);

  // Fetch the fuel pump associated with a user's email
  const fetchAssociatedFuelPump = async (email: string) => {
    try {
      // First try the RPC function for case-insensitive matching
      const { data: fuelPumpData, error: rpcError } = await supabase
        .rpc('get_fuel_pump_by_email', { email_param: email.toLowerCase() });
        
      if (!rpcError && fuelPumpData && fuelPumpData.length > 0) {
        const fuelPump = fuelPumpData[0];
        console.log(`Found fuel pump via RPC: ${fuelPump.id} (${fuelPump.name})`);
        setFuelPumpId(fuelPump.id);
        setFuelPumpName(fuelPump.name);
        
        // Update user with fuelPumpId
        if (user) {
          const updatedUser = {
            ...user,
            fuelPumpId: fuelPump.id,
            fuelPumpName: fuelPump.name
          };
          setUser(updatedUser);
          
          // Update session in localStorage
          if (session) {
            const updatedSession = {
              ...session,
              user: updatedUser
            };
            setSession(updatedSession);
            localStorage.setItem('fuel_pro_session', JSON.stringify(updatedSession));
          }
        }
        return;
      }
      
      if (rpcError) {
        console.error('Error using RPC function:', rpcError);
      }
      
      // Fallback to direct query if RPC fails
      const { data: fuelPump, error } = await supabase
        .from('fuel_pumps')
        .select('id, name')
        .ilike('email', email)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (fuelPump) {
        console.log(`Found fuel pump via direct query: ${fuelPump.id} (${fuelPump.name})`);
        setFuelPumpId(fuelPump.id);
        setFuelPumpName(fuelPump.name);
        
        // Update user with fuelPumpId
        if (user) {
          const updatedUser = {
            ...user,
            fuelPumpId: fuelPump.id,
            fuelPumpName: fuelPump.name
          };
          setUser(updatedUser);
          
          // Update session in localStorage
          if (session) {
            const updatedSession = {
              ...session,
              user: updatedUser
            };
            setSession(updatedSession);
            localStorage.setItem('fuel_pro_session', JSON.stringify(updatedSession));
          }
        }
      } else {
        console.log(`No fuel pump found for email: ${email}, using hardcoded fallback`);
        const fallbackId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
        const fallbackName = 'Default Fuel Pump';
        
        setFuelPumpId(fallbackId);
        setFuelPumpName(fallbackName);
        
        // Update user with fallback fuelPumpId
        if (user) {
          const updatedUser = {
            ...user,
            fuelPumpId: fallbackId,
            fuelPumpName: fallbackName
          };
          setUser(updatedUser);
          
          // Update session in localStorage
          if (session) {
            const updatedSession = {
              ...session,
              user: updatedUser
            };
            setSession(updatedSession);
            localStorage.setItem('fuel_pro_session', JSON.stringify(updatedSession));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching associated fuel pump:', error);
      
      // Use fallback fuel pump ID
      const fallbackId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
      const fallbackName = 'Default Fuel Pump';
      
      setFuelPumpId(fallbackId);
      setFuelPumpName(fallbackName);
      
      // Update user with fallback fuelPumpId
      if (user) {
        const updatedUser = {
          ...user,
          fuelPumpId: fallbackId,
          fuelPumpName: fallbackName
        };
        setUser(updatedUser);
        
        // Update session in localStorage
        if (session) {
          const updatedSession = {
            ...session,
            user: updatedUser
          };
          setSession(updatedSession);
          localStorage.setItem('fuel_pro_session', JSON.stringify(updatedSession));
        }
      }
    }
  };

  const login = async (userId: string, userData: any, rememberMe: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Ensure valid role is set
      if (!['admin', 'staff', 'super_admin'].includes(userData.role)) {
        userData.role = 'staff'; // Default to staff if no valid role
      }
      
      // Ensure fuelPumpId is set
      if (!userData.fuelPumpId) {
        userData.fuelPumpId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
        userData.fuelPumpName = 'Default Fuel Pump';
        console.log(`No fuel pump ID provided during login, using default: ${userData.fuelPumpId}`);
      }
      
      console.log('Login with user data:', userData);
      
      // Create user profile from user data
      const userProfile: UserProfile = {
        id: userId,
        username: userData.username || userData.email?.split('@')[0] || 'user',
        email: userData.email || '',
        role: userData.role,
        fuelPumpId: userData.fuelPumpId,
        fuelPumpName: userData.fuelPumpName
      };
      
      // Create session
      const newSession: Session = {
        access_token: `token_${userId}`,  // In a real app, this would be a JWT
        user: userProfile
      };
      
      // Store session if rememberMe is true
      if (rememberMe) {
        localStorage.setItem('fuel_pro_session', JSON.stringify(newSession));
        console.log('Session stored in localStorage with fuel pump ID:', userProfile.fuelPumpId);
      }
      
      // Update state
      setUser(userProfile);
      setSession(newSession);
      
      // Set role states
      setIsSuperAdmin(userProfile.role === 'super_admin');
      setIsAdmin(userProfile.role === 'admin');
      setIsStaff(userProfile.role === 'staff');
      
      // Set fuel pump ID and name
      if (userProfile.fuelPumpId) {
        setFuelPumpId(userProfile.fuelPumpId);
        setFuelPumpName(userProfile.fuelPumpName || null);
        console.log(`Fuel pump ID set in context: ${userProfile.fuelPumpId}`);
      }
      
      // Also update the Supabase user metadata to store the fuel pump ID
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            fuelPumpId: userProfile.fuelPumpId,
            fuelPumpName: userProfile.fuelPumpName
          }
        });
        
        if (updateError) {
          console.error('Error updating user metadata:', updateError);
        } else {
          console.log('User metadata updated with fuel pump ID:', userProfile.fuelPumpId);
        }
      } catch (metadataError) {
        console.error('Error updating user metadata:', metadataError);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userProfile.username}!`,
      });
      
      return true;
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
    try {
      // Clear session from localStorage
      localStorage.removeItem('fuel_pro_session');
      
      // Reset state
      setUser(null);
      setSession(null);
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsStaff(false);
      setFuelPumpId(null);
      setFuelPumpName(null);
      
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
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isSuperAdmin,
      isAdmin,
      isStaff,
      fuelPumpId,
      fuelPumpName,
      login, 
      logout, 
      isLoading, 
      session 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
