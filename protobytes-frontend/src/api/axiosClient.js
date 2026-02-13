// src/api/axiosClient.js
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // required for cookies
  headers: { "Content-Type": "application/json" },
});

let accessToken = null;
let isRefreshing = false;
let refreshPromise = null;

// 🔹 Set access token in memory (call this after login/2FA/refresh)
export const setAccessToken = (token) => {
  accessToken = token;
};

// 🔹 Attach access token to every request
axiosClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 🔹 Auto refresh on 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // prevent infinite loop
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = axiosClient.post("/auth/refresh");
        }

        const res = await refreshPromise;
        const newAccessToken = res.data?.accessToken || res.data?.token || null;
        setAccessToken(newAccessToken);

        // retry original request
        originalRequest.headers = originalRequest.headers || {};
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        } else {
          delete originalRequest.headers.Authorization;
        }
        return axiosClient(originalRequest);
      } catch {
        setAccessToken(null);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);
