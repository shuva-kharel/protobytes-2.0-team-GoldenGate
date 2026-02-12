import { axiosClient } from "./axiosClient";

export type KycStatus = "pending" | "approved" | "rejected";

export type KycDoc = {
  _id: string;
  fullName: string;
  dob: string;
  address: string;
  country: string;
  phone: string;
  category: string;
  governmentIdNumber: string;
  status: KycStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export const kycApi = {
  me() {
    return axiosClient.get<{ kyc: KycDoc | null }>("/kyc/me");
  },

  submit(formData: FormData) {
    return axiosClient.post("/kyc/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
