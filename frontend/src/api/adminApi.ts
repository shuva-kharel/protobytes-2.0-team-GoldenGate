// src/api/adminApi.ts
import { axiosClient } from "./axiosClient";

/**
 * ✅ IMPORTANT:
 * If your backend admin endpoints are:
 *   /api/admin/...
 * keep ADMIN_BASE = "/admin"
 *
 * If your backend admin endpoints are:
 *   /api/auth/admin/...
 * change ADMIN_BASE = "/auth/admin"
 */
const ADMIN_BASE = "/admin"; // change to "/auth/admin" if needed

export const adminApi = {
  // GET /api/admin/kyc?status=pending&category=Individual
  listKyc(params: { status?: string; category?: string } = {}) {
    return axiosClient.get(`${ADMIN_BASE}/kyc`, { params });
  },

  // PATCH /api/admin/kyc/:id/approve
  approveKyc(id: string) {
    return axiosClient.patch(`${ADMIN_BASE}/kyc/${id}/approve`, {});
  },

  // PATCH /api/admin/kyc/:id/reject
  rejectKyc(id: string, reason: string) {
    return axiosClient.patch(`${ADMIN_BASE}/kyc/${id}/reject`, { reason });
  },

  // GET /api/admin/stats
  stats() {
    return axiosClient.get(`${ADMIN_BASE}/stats`);
  },

  // ✅ GET /api/admin/kyc/:id/images  (signed URLs)
  signedImages(id: string) {
    return axiosClient.get(`${ADMIN_BASE}/kyc/${id}/images`);
  },
};
