// src/features/auth/authStore.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../../api/authApi";
import { axiosClient } from "../../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // ✅ logout clears server cookies + local state
  const logout = async () => {
    try {
      await authApi.logout(); // server-side clears refresh token cookie
    } catch (e) {
      // ignore network issues
    }
    setUser(null);
  };

  // ✅ fetch current user & refresh access token if needed
  const loadMe = async () => {
    try {
      const res = await authApi.me(); // expects valid access token
      setUser(res.data);
    } catch (err) {
      // Access token might be expired → try refresh
      try {
        const refreshRes = await authApi.refreshToken(); // uses HTTP-only cookie
        const { accessToken, user: refreshedUser } = refreshRes.data;

        // Set access token globally for axios
        axiosClient.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;
        setUser(refreshedUser);
      } catch (refreshErr) {
        setUser(null);
      }
    } finally {
      setBooting(false);
    }
  };

  // Install axios interceptor once
  useEffect(() => {
    // Automatically refresh access tokens on 401 responses
    const interceptor = axiosClient.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes("/auth/refresh-token")
        ) {
          originalRequest._retry = true;
          try {
            const refreshRes = await authApi.refreshToken();
            const { accessToken, user: refreshedUser } = refreshRes.data;
            axiosClient.defaults.headers.common["Authorization"] =
              `Bearer ${accessToken}`;
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            setUser(refreshedUser);
            return axiosClient(originalRequest);
          } catch {
            setUser(null);
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => axiosClient.interceptors.response.eject(interceptor);
  }, []);

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
