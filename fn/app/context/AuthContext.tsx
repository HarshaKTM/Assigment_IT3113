'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profilePhoto?: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Check for token on first load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // In development mode, always consider the token valid
          if (process.env.NODE_ENV === 'development') {
            // Use a consistent token for development
            if (token !== 'mock-token-for-development') {
              localStorage.setItem('token', 'mock-token-for-development');
            }
            
            // Get user data from localStorage or create mock user
            const userData = localStorage.getItem('user');
            if (userData) {
              setUser(JSON.parse(userData));
            } else {
              // Create a mock user for development
              const mockUser = {
                _id: 'mock-user-id',
                username: 'mockuser',
                email: 'mock@example.com',
                role: 'user'
              };
              localStorage.setItem('user', JSON.stringify(mockUser));
              setUser(mockUser);
            }
          } else {
            // In production, check token and get user data
            try {
              const userData = localStorage.getItem('user');
              if (userData) {
                setUser(JSON.parse(userData));
              } else {
                const { user } = await authAPI.getCurrentUser();
                setUser(user);
                localStorage.setItem('user', JSON.stringify(user));
              }
            } catch (error) {
              console.error('Error getting user data:', error);
              // Don't auto-logout in case of errors
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login({ email, password });
      
      // In development mode, use consistent token
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('token', 'mock-token-for-development');
      } else {
        localStorage.setItem('token', response.token);
      }
      
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      toast.success('Login successful');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      
      // In development mode, use consistent token
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('token', 'mock-token-for-development');
      } else {
        localStorage.setItem('token', response.token);
      }
      
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      toast.success('Registration successful');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profileData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.updateProfile(profileData);
      
      // Update user state with the updated profile data
      setUser(response.user);
      
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setLoading(true);
      
      try {
        await authAPI.logout();
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading && !isInitialized,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 