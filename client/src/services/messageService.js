
import api from "./api";

// Start or retrieve an existing conversation
export const startConversation = async (listingId) => {
  const response = await api.post("/conversations", { listingId });
  return response.data;
};

// Send a message
export const sendMessage = async (conversationId, text) => {
  const response = await api.post("/messages", {
    conversationId,
    text,
  });

  return response.data;
};

// Get messages of a conversation
export const getMessages = async (conversationId, params = {}) => {
  const response = await api.get(`/messages/${conversationId}`, {
    params,
  });

  return response.data;
};


export const markMessagesRead = async (conversationId) => {
  const response = await api.patch(
    `/messages/${conversationId}/read`
  );

  return response.data;
};
