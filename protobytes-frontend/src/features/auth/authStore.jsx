// src/features/auth/authStore.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../../api/authApi";
import { setAccessToken } from "../../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // ✅ logout clears server cookies + local state
  const logout = async () => {
    try {
      await authApi.logout(); // server-side clears refresh token cookie
    } catch {
      // ignore network issues
    }
    setAccessToken(null);
    setUser(null);
  };

  // ✅ fetch current user & refresh access token if needed
  const loadMe = async () => {
    try {
      const res = await authApi.me(); // expects valid access token
      setUser(res.data);
      return res.data;
    } catch {
      // Access token might be expired → try refresh
      try {
        const refreshRes = await authApi.refresh(); // uses HTTP-only cookie
        const token =
          refreshRes.data?.accessToken || refreshRes.data?.token || null;
        setAccessToken(token);

        const meRes = await authApi.me();
        setUser(meRes.data);
        return meRes.data;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    } finally {
      setBooting(false);
    }
  };

  // Load current session on initial render
  useEffect(() => {
    loadMe();
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
