import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { axiosClient } from "../api/axiosClient";

export type AuthUser = {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  isEmailVerified?: boolean;
  role?: "user" | "admin";
};

type AuthCtx = {
  user: AuthUser | null;
  booting: boolean;
  loadMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);

  const loadMe = async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setBooting(false);
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout", {});
    } catch {}
    setUser(null);
  };

  useEffect(() => {
    loadMe();
  }, []);

  const value = useMemo(
    () => ({ user, booting, loadMe, logout }),
    [user, booting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
