
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

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
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  const [fuelPumpName, setFuelPumpName] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a stored session
    const storedSession = getStoredSession();
    
    if (storedSession) {
      setSession(storedSession);
      setUser(storedSession.user);
      
      // Check if user is a super admin
      setIsSuperAdmin(storedSession.user.role === 'super_admin');
      
      // If not a super admin, fetch associated fuel pump
      if (storedSession.user.role !== 'super_admin') {
        fetchAssociatedFuelPump(storedSession.user.email);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Fetch the fuel pump associated with a user's email
  const fetchAssociatedFuelPump = async (email: string) => {
    try {
      const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:5000'}/api/fuel-pumps?email=${email}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setFuelPumpId(data[0].id);
        setFuelPumpName(data[0].name);
      } else {
        setFuelPumpId(null);
        setFuelPumpName(null);
      }
    } catch (error) {
      console.error('Error fetching associated fuel pump:', error);
      setFuelPumpId(null);
      setFuelPumpName(null);
    }
  };

  const login = async (userId: string, userData: any, rememberMe: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Create user profile from user data
      const userProfile: UserProfile = {
        id: userId,
        username: userData.username || userData.email?.split('@')[0] || 'user',
        email: userData.email || '',
        role: userData.role || 'staff'
      };
      
      // Create session
      const newSession: Session = {
        access_token: `token_${userId}`,  // In a real app, this would be a JWT
        user: userProfile
      };
      
      // Store session if rememberMe is true
      if (rememberMe) {
        localStorage.setItem('fuel_pro_session', JSON.stringify(newSession));
      }
      
      // Update state
      setUser(userProfile);
      setSession(newSession);
      
      // Check if user is a super admin
      setIsSuperAdmin(userProfile.role === 'super_admin');
      
      // If not a super admin, fetch associated fuel pump
      if (userProfile.role !== 'super_admin') {
        await fetchAssociatedFuelPump(userProfile.email);
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
