// src/api/axiosInterceptors.js
import { axiosClient } from "./axiosClient";
import { authApi } from "./authApi";

/**
 * Automatically refreshes access token (cookie-based) on 401
 * and retries the original request.
 *
 * Works with:
 * - HttpOnly cookies: access_token + refresh_token
 * - POST /auth/refresh endpoint
 *
 * Usage:
 *   setupAxiosInterceptors(() => logoutUser());
 */
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

export function setupAxiosInterceptors(onLogout) {
  axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If there's no response (network error), just reject
      if (!error.response) {
        return Promise.reject(error);
      }

      // Only handle 401
      if (error.response.status !== 401) {
        return Promise.reject(error);
      }

      // Prevent infinite loops
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      const url = originalRequest.url || "";

      // Don't auto-refresh for login/2fa endpoints
      // (these can legitimately return 401 and should not trigger refresh)
      if (
        url.includes("/auth/login") ||
        url.includes("/auth/2fa/verify") ||
        url.includes("/auth/2fa/resend") ||
        url.includes("/auth/register") ||
        url.includes("/auth/verify-email")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If refresh already happening, wait in queue and retry after it completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // Start refresh flow
      isRefreshing = true;

      try {
        await authApi.refresh(); // sets a new access_token cookie
        resolveQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        resolveQueue(refreshError);
        if (typeof onLogout === "function") onLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
}