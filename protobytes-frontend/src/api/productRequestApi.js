import { axiosClient } from "./axiosClient";

export const productRequestApi = {
  list(params = {}) {
    return axiosClient.get("/product-requests", { params });
  },
  mine() {
    return axiosClient.get("/product-requests/mine/list");
  },
  create(payload) {
    return axiosClient.post("/product-requests", payload);
  },
  update(id, payload) {
    return axiosClient.put(`/product-requests/${id}`, payload);
  },
  close(id) {
    return axiosClient.patch(`/product-requests/${id}/close`);
  },
  remove(id) {
    return axiosClient.delete(`/product-requests/${id}`);
  },
};
