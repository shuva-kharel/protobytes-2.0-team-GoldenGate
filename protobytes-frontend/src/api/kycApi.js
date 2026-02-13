// src/api/kycApi.js
import { axiosClient } from "./axiosClient";

export function getMyKyc() {
  return axiosClient.get("/kyc/me");
}

export function submitKyc(formData) {
  // formData must have fields + files as per backend
  return axiosClient.post("/kyc/submit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}