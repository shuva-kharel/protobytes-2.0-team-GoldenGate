// src/features/auth/authStore.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../../api/authApi";
import { setupAxiosInterceptors } from "../../api/axiosInterceptors";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // ✅ logout clears server cookies + local state
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore network issues
    }
    setUser(null);
  };

  // ✅ called on app start (and after login)
  const loadMe = async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch (e) {
      setUser(null);
    } finally {
      setBooting(false);
    }
  };

  // Install axios interceptor once
  useEffect(() => {
    setupAxiosInterceptors(logout);
  }, []);

  // Load current session on initial render
  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, setUser, booting, loadMe, logout }),
    [user, booting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
