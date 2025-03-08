
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
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

// API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    try {
      // Try to login with the Django backend
      const response = await fetch(`${API_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        const userData: User = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: username === 'admin' ? 'admin' : 'staff', // Set role based on username until we implement proper roles
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.username}!`,
        });
        
        return true;
      } else {
        // Fallback to mock users for development purposes
        if (username === 'admin' && password === 'admin123') {
          const mockUser: User = {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin'
          };
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
          toast({
            title: "Login successful",
            description: "Welcome back, admin!",
          });
          return true;
        } else if (username === 'staff' && password === 'staff123') {
          const mockUser: User = {
            id: '2',
            username: 'staff',
            email: 'staff@example.com',
            role: 'staff'
          };
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
          toast({
            title: "Login successful",
            description: "Welcome back, staff!",
          });
          return true;
        } else {
          toast({
            title: "Login failed",
            description: data.message || "Invalid username or password",
            variant: "destructive",
          });
          return false;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to mock users if API is not available
      if (username === 'admin' && password === 'admin123') {
        const mockUser: User = {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin'
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        toast({
          title: "Login successful (offline mode)",
          description: "Welcome back, admin!",
        });
        return true;
      } else if (username === 'staff' && password === 'staff123') {
        const mockUser: User = {
          id: '2',
          username: 'staff',
          email: 'staff@example.com',
          role: 'staff'
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        toast({
          title: "Login successful (offline mode)",
          description: "Welcome back, staff!",
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "An error occurred during login or invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Try to logout with the Django backend
      await fetch(`${API_URL}/api/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local user state
      setUser(null);
      localStorage.removeItem('user');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
