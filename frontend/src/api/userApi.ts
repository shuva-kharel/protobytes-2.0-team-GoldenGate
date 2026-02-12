// src/api/userApi.ts
import { axiosClient } from "./axiosClient";

export const userApi = {
  /**
   * POST /api/user/update-profile
   * multipart/form-data:
   * - username
   * - fullName
   * - bio
   * - profilePicture (file)
   */
  updateProfile(formData: FormData) {
    return axiosClient.post("/user/update-profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
