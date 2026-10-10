"use client";


/**
 * Authentication Context
 *
 * Provides user state, login, logout, and registration functions
 * to all components in the app via React Context.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import api from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!api.isAuthenticated()) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        // Token is invalid or expired — clear it
        api.clearToken();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      await api.login(username, password);
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    setError(null);
    try {
      await api.register(username, email, password);
      // Auto-login after registration
      await api.login(username, password);
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
