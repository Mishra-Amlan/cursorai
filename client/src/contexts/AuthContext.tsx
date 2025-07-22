import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '@/utils/api';

export type UserRole = 'admin' | 'auditor' | 'reviewer' | 'corporate' | 'hotelgm';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Login and get token
      const authResponse = await apiClient.login({ username, password });
      
      // Get current user info
      const currentUser = await apiClient.getCurrentUser();
      
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    localStorage.removeItem('user');
    setError(null);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('authToken');
        
        if (storedUser && storedToken) {
          // Verify token is still valid by getting current user
          try {
            const currentUser = await apiClient.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            // Token expired or invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            console.log('Token expired, please login again');
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
      isLoading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
