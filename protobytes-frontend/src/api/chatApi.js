import { axiosClient } from "./axiosClient";

export const chatApi = {
  listConversations() {
    return axiosClient.get("/chat/conversations");
  },

  getOrCreateConversation(userId, payload = {}) {
    return axiosClient.post(`/chat/conversations/with/${userId}`, payload);
  },

  getMessages(conversationId, params = {}) {
    return axiosClient.get(`/chat/conversations/${conversationId}/messages`, {
      params,
    });
  },

  sendMessage(conversationId, text) {
    return axiosClient.post(`/chat/conversations/${conversationId}/messages`, { text });
  },
};
