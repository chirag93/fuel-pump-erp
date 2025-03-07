
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  fuel_pump?: number;
  fuel_pump_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Create a base API URL that can be configured for different environments
// For local development this could be http://localhost:8000
// For Supabase hosting this would be your Supabase function URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-supabase-project.supabase.co/functions/api';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    console.log('Attempting login with username:', username);
    console.log('Using API base URL:', API_BASE_URL);
    
    // Try both with and without trailing slash
    const loginEndpoints = [
      `${API_BASE_URL}/login`,
      `${API_BASE_URL}/login/`,
      // Also try Flask app endpoints if Django fails
      `${API_BASE_URL}/api/login`,
      `${API_BASE_URL}/api/login/`
    ];
    
    for (const endpoint of loginEndpoints) {
      try {
        console.log(`Trying login endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          credentials: 'include', // Include cookies
        });
        
        console.log(`Login response from ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Login error from ${endpoint}:`, errorText);
          continue; // Try the next endpoint
        }
        
        const data = await response.json();
        console.log(`Login data from ${endpoint}:`, data);
        
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          toast({
            title: "Login successful",
            description: `Welcome back, ${data.user.username}!`,
          });
          
          // Redirect based on role
          if (data.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/dashboard');
          }
          
          setIsLoading(false);
          return true;
        } else {
          toast({
            title: "Login failed",
            description: data.message || "Invalid username or password",
            variant: "destructive",
          });
          setIsLoading(false);
          return false;
        }
      } catch (error) {
        console.error(`Login error with endpoint ${endpoint}:`, error);
        // Continue to try the next endpoint
      }
    }
    
    // If we get here, all endpoints failed
    toast({
      title: "Login failed",
      description: "Could not connect to the server. Please check if your backend is properly configured and running.",
      variant: "destructive",
    });
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
