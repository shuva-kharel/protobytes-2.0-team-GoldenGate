// src/api/productApi.ts
import { axiosClient } from "./axiosClient";

export type Product = {
  _id: string;
  name: string;
  category: string;
  price?: number;
  borrowPrice: number;
  location: string;
  productAge?: string;
  description?: string;
  status?: "available" | "borrowed" | "inactive";
  image?: { url?: string; publicId?: string };
  uploadedBy?: { user?: string; username?: string };
  createdAt?: string;
  updatedAt?: string;
};

export const productApi = {
  // Public list
  list(params: any = {}) {
    return axiosClient.get<{ items: Product[] }>("/products", { params });
  },

  // Create (verified user)
  create(formData: FormData) {
    return axiosClient.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // My products (verified user)
  mine() {
    return axiosClient.get<{ items: Product[] }>("/products/mine/list");
  },

  // Update my product (verified user) - supports multipart image update
  update(id: string, formData: FormData) {
    return axiosClient.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Delete my product (verified user)
  remove(id: string) {
    return axiosClient.delete(`/products/${id}`);
  },
};
