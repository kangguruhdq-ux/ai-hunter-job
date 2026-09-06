"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, getStoredToken, setStoredToken } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; full_name: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // Safety watchdog timeout: never stay in loading state longer than 3 seconds
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    try {
      setToken(existingToken);
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      setStoredToken(null);
      setUser(null);
      setToken(null);
    } finally {
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await api.login(credentials);
      setStoredToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; full_name: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await api.register(data);
      setStoredToken(response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Proceed with local logout regardless of network state
    } finally {
      setStoredToken(null);
      setUser(null);
      setToken(null);
      router.push("/login");
    }
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = Boolean(user && user.role === "admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
