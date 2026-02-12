import { axiosClient } from "./axiosClient";

export const authApi = {
  register(payload: {
    username: string;
    fullName: string;
    email: string;
    password: string;
  }) {
    return axiosClient.post("/auth/register", payload);
  },

  verifyEmail(payload: { email: string; otp: string }) {
    return axiosClient.post("/auth/verify-email", payload);
  },

  resendEmailOtp(payload: { email: string }) {
    return axiosClient.post("/auth/resend-otp", payload);
  },

  login(payload: { login: string; password: string }) {
    // ✅ sets 2fa_token cookie
    return axiosClient.post("/auth/login", payload);
  },

  verify2FA(payload: { otp: string }) {
    // ✅ sets access_token + refresh_token cookies
    return axiosClient.post("/auth/2fa/verify", payload);
  },

  resend2FA() {
    return axiosClient.post("/auth/2fa/resend", {});
  },

  me() {
    return axiosClient.get("/auth/me");
  },

  refresh() {
    return axiosClient.post("/auth/refresh", {});
  },

  logout() {
    return axiosClient.post("/auth/logout", {});
  },

  forgotPassword(payload: { email: string }) {
    return axiosClient.post("/auth/forgot-password", payload);
  },

  resetPassword(payload: { token: string; email: string; password: string }) {
    return axiosClient.post("/auth/reset-password", payload);
  },
};
