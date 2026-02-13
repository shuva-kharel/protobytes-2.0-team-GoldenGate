import { axiosClient } from "./axiosClient";

export const userApi = {
  getPublicProfileById(id) {
    return axiosClient.get(`/user/id/${id}`);
  },

  getPublicProfileByUsername(username) {
    return axiosClient.get(`/user/username/${username}`);
  },
};
