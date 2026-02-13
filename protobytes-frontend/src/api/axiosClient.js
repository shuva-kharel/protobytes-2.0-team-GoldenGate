// src/api/axiosClient.js
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // required for cookies
  headers: { "Content-Type": "application/json" },
});

let accessToken = null;

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

    // prevent infinite loop
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      // originalRequest._retry = true;

      try {
        const res = await axiosClient.post("/auth/refresh");

        const newAccessToken = res.data.token;

        // store new token in memory
        accessToken = newAccessToken;

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // refresh failed → force logout
        // window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
