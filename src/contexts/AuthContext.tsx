
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'super_admin';
  fuelPumpId?: string; // Associated fuel pump ID
  fuelPumpName?: string; // Associated fuel pump name
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  fuelPumpId: string | null;
  fuelPumpName: string | null;
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  const [fuelPumpName, setFuelPumpName] = useState<string | null>(null);

  // Check if the user is a super admin
  const checkIsSuperAdmin = async (userId: string) => {
    try {
      const { data: superAdminData } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      setIsSuperAdmin(!!superAdminData);
      return !!superAdminData;
    } catch (error) {
      console.error('Error checking super admin status:', error);
      setIsSuperAdmin(false);
      return false;
    }
  };

  // Fetch user role from the database
  const fetchUserRole = async (userId: string): Promise<'admin' | 'staff' | 'super_admin'> => {
    try {
      // Check if user is a super admin
      const { data: superAdminData, error: superAdminError } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (superAdminData) {
        console.log('User is a super admin');
        return 'super_admin';
      }
      
      // Check if user is an admin (specific email or has admin in profiles)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileData?.email === 'admin@example.com' || profileData?.role === 'admin') {
        console.log('User is an admin');
        return 'admin';
      }
      
      // Default to staff role
      console.log('User is staff');
      return 'staff';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'staff'; // Default to staff if there's an error
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Fetch the role from the database
        const role = await fetchUserRole(session.user.id);
        const userProfile: UserProfile = {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || 'user',
          email: session.user.email || '',
          role: role
        };
        
        setUser(userProfile);
        setIsSuperAdmin(role === 'super_admin');
        
        // If not a super admin, fetch associated fuel pump
        if (role !== 'super_admin') {
          fetchAssociatedFuelPump(session.user.email);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        // Fetch the role from the database
        const role = await fetchUserRole(session.user.id);
        const userProfile: UserProfile = {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || 'user',
          email: session.user.email || '',
          role: role
        };
        
        setUser(userProfile);
        setIsSuperAdmin(role === 'super_admin');
        
        // If not a super admin, fetch associated fuel pump
        if (role !== 'super_admin') {
          fetchAssociatedFuelPump(session.user.email);
        }
      } else {
        setUser(null);
        setFuelPumpId(null);
        setFuelPumpName(null);
        setIsSuperAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch the fuel pump associated with a user's email
  const fetchAssociatedFuelPump = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('fuel_pumps')
        .select('id, name')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('Error fetching associated fuel pump:', error);
        setFuelPumpId(null);
        setFuelPumpName(null);
        return;
      }
      
      if (data) {
        setFuelPumpId(data.id);
        setFuelPumpName(data.name);
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
        
        // Check if the user is a super admin using the defined function
        await checkIsSuperAdmin(data.user.id);
        
        // If not a super admin, fetch associated fuel pump
        const role = await fetchUserRole(data.user.id);
        const userProfile: UserProfile = {
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'user',
          email: data.user.email || '',
          role: role
        };

        setUser(userProfile);
        
        if (role !== 'super_admin') {
          await fetchAssociatedFuelPump(data.user.email);
        }
        
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
      setIsSuperAdmin(false);
      setFuelPumpId(null);
      setFuelPumpName(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  // Helper function to map Supabase user to our UserProfile format
  const mapUserToProfile = (supabaseUser: User): UserProfile => {
    // Check if the user has an explicit role in their metadata
    let role = supabaseUser.app_metadata?.role as 'admin' | 'staff' | 'super_admin';
    
    // Special case for admin@example.com - always set as admin
    if (supabaseUser.email === 'admin@example.com') {
      role = 'admin';
    }
    
    // Log the role for debugging
    console.log('User role from metadata:', role);
    console.log('User email:', supabaseUser.email);
    
    return {
      id: supabaseUser.id,
      username: supabaseUser.email?.split('@')[0] || 'user',
      email: supabaseUser.email || '',
      // Default to 'staff' role if no role is specified
      role: role || 'staff'
    };
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
