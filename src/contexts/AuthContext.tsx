import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiService } from "@/services/api";

interface User {
  id?: number;
  email: string;
  name: string;
  role?: string;
  phone?: string;
  institution?: string;
  department?: string;
  license?: string;
  npi?: string;
  specialty?: string;
  subspecialty?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("oncoai_user");
    const token = localStorage.getItem("oncoai_token");
    // Only restore a stored user if a token is present. Restoring a user
    // without a token caused the UI to appear logged in while the backend
    // received no Authorization header (leading to 'Token is missing').
    if (stored && token) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    // If there's a stored user but no token, clear it to avoid misleading state.
    if (stored && !token) {
      try {
        localStorage.removeItem("oncoai_user");
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      // Backend may return `{ token, user }` or `{ data: { token, user } }`.
      // Log for debugging and support both shapes.
      // eslint-disable-next-line no-console
      console.debug('[Auth] login response:', response);

      const token = (response && (response.token || response.data?.token)) || null;
      const userPayload = (response && (response.user || response.data?.user)) || null;

      if (token && userPayload) {
        const newUser = {
          id: userPayload.id,
          email: userPayload.email,
          name: userPayload.name,
          role: userPayload.role,
        };

        setUser(newUser);
        localStorage.setItem("oncoai_token", token);
        localStorage.setItem("oncoai_user", JSON.stringify(newUser));
        // Debug: confirm token stored
        // eslint-disable-next-line no-console
        console.debug('[Auth] token saved length:', (localStorage.getItem('oncoai_token') || '').length);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      const message = String(error?.message || '').toLowerCase();

      if (message.includes('failed to fetch') || message.includes('backend server may not be running')) {
        // Preserve the error for display in the UI.
        return false;
      }

      if (message.includes('invalid credentials') || message.includes('email and password are required')) {
        return false;
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("oncoai_user");
      localStorage.removeItem("oncoai_token");
    } catch {
      // ignore storage errors
    }
    window.location.replace("/");
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("oncoai_user", JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, loading }}>
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

