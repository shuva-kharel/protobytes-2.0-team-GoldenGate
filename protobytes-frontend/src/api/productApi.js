import { axiosClient } from "./axiosClient";

/**
 * Public endpoints:
 * GET /api/products?q=&location=&category=&page=&limit=
 */
export const productApi = {
  list(params = {}) {
    return axiosClient.get("/products", { params });
  },

  getById(id) {
    return axiosClient.get(`/products/${id}`);
  },
};