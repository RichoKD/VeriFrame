"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  authAPI,
  setTokens,
  clearTokens,
  type User,
  type AuthResponse,
} from "@/lib/api-client";

export type UserRole = "creator" | "node" | "admin" | null;

interface AuthContextType {
  // State
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (
    address: string,
    signature: string[],
    challenge: { message: string; timestamp: number }
  ) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedRole = localStorage.getItem("user_role") as UserRole;
        const storedAddress = localStorage.getItem("user_address");

        if (storedRole) {
          setRoleState(storedRole);
        }

        // Try to fetch current user if we have a token
        const token = localStorage.getItem("access_token");
        if (token && storedAddress) {
          try {
            const currentUser = await authAPI.getCurrentUser();
            setUser(currentUser);

            // Auto-detect role if not set
            if (!storedRole) {
              const detectedRole = detectRole(currentUser);
              setRoleState(detectedRole);
              if (detectedRole) {
                localStorage.setItem("user_role", detectedRole);
              }
            }
          } catch (err) {
            // Token might be expired, clear it
            console.error("Failed to load user:", err);
            clearTokens();
          }
        }
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const detectRole = (user: User): UserRole => {
    if (user.is_admin) return "admin";
    // For now, treat verified users as potential nodes, others as creators
    if (user.is_verified) return "node";
    return "creator";
  };

  const login = useCallback(
    async (
      address: string,
      signature: string[],
      challenge: { message: string; timestamp: number }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response: AuthResponse = await authAPI.authenticate({
          address,
          message: challenge.message,
          signature,
          timestamp: challenge.timestamp,
        });

        // Store tokens
        setTokens(response.access_token, response.refresh_token);
        localStorage.setItem("user_address", address);

        // Set user
        setUser(response.user);

        // Auto-detect role
        const detectedRole = detectRole(response.user);
        setRoleState(detectedRole);
        if (detectedRole) {
          localStorage.setItem("user_role", detectedRole);
        }

        console.log("Login successful:", response.user);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Authentication failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearTokens();
      setUser(null);
      setRoleState(null);
      setIsLoading(false);
    }
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem("user_role", newRole);
    } else {
      localStorage.removeItem("user_role");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;

    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error("Failed to refresh user:", err);
      // Token might be expired
      await logout();
    }
  }, [user, logout]);

  const value: AuthContextType = {
    user,
    role,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    setRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
