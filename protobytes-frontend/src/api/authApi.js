// src/api/authApi.js
import { axiosClient } from "./axiosClient";

/**
 * Auth API functions (cookie-based auth).
 * Backend uses HttpOnly cookies, so axiosClient MUST use withCredentials: true.
 */
export const authApi = {
  // ✅ Register + Email verification
  register(payload) {
    return axiosClient.post("/auth/register", payload);
  },

  verifyEmail(payload) {
    return axiosClient.post("/auth/verify-email", payload);
  },

  resendEmailOtp(payload) {
    return axiosClient.post("/auth/resend-otp", payload);
  },

  // ✅ Login + 2FA
  login(payload) {
    // sets 2fa_token cookie
    return axiosClient.post("/auth/login", payload);
  },

  verify2FA(payload) {
    // sets access_token + refresh_token cookies
    return axiosClient.post("/auth/2fa/verify", payload);
  },

  resend2FA() {
    return axiosClient.post("/auth/2fa/resend", {});
  },

  get2FASettings() {
    return axiosClient.get("/auth/2fa/settings");
  },

  enableEmail2FA() {
    return axiosClient.post("/auth/2fa/email/enable", {});
  },

  startAuthenticatorSetup() {
    return axiosClient.post("/auth/2fa/authenticator/setup", {});
  },

  verifyAuthenticatorSetup(payload) {
    return axiosClient.post("/auth/2fa/authenticator/verify", payload);
  },

  disable2FA() {
    return axiosClient.post("/auth/2fa/disable", {});
  },

  // ✅ Session / User
  me() {
    return axiosClient.get("/auth/me");
  },

  refresh() {
    return axiosClient.post("/auth/refresh", {});
  },

  // Backward-compatible alias used in older code paths
  refreshToken() {
    return axiosClient.post("/auth/refresh", {});
  },

  logout() {
    return axiosClient.post("/auth/logout", {});
  },

  // ✅ Forgot / Reset password
  forgotPassword(payload) {
    return axiosClient.post("/auth/forgot-password", payload);
  },

  resetPassword(payload) {
    return axiosClient.post("/auth/reset-password", payload);
  },

  // ✅ Settings: update password
  updatePassword(payload) {
    return axiosClient.post("/auth/update-password", payload);
  },

  // ✅ Optional: session tracking endpoints (only if your backend has them)
  listSessions() {
    return axiosClient.get("/auth/sessions");
  },

  revokeSession(sessionId) {
    return axiosClient.delete(`/auth/sessions/${sessionId}`);
  },

  revokeAllSessions() {
    return axiosClient.delete("/auth/sessions");
  },

  revokeOtherSessions() {
    return axiosClient.post("/auth/sessions/revoke-others");
  },
};
