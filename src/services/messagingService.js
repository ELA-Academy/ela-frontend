import api from "../utils/api";

export const getUnreadMessagesCount = async () => {
  try {
    const response = await api.get("/messaging/conversations/unread-count");
    return response.data.count;
  } catch (error) {
    console.error("Error fetching unread messages count:", error);
    return 0; // Return 0 on error
  }
};

// Fetch all conversations for the current user
export const getConversations = async () => {
  try {
    const response = await api.get("/messaging/conversations");
    return response.data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

// Fetch all messages for a specific conversation
export const getMessages = async (conversationId) => {
  try {
    const response = await api.get(
      `/messaging/conversations/${conversationId}/messages`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching messages for convo ${conversationId}:`,
      error
    );
    throw error;
  }
};

// Send a new message
export const sendMessage = async (conversationId, content) => {
  try {
    const response = await api.post(
      `/messaging/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Get all users available for messaging
export const getUsersForMessaging = async () => {
  try {
    const response = await api.get("/messaging/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users for messaging:", error);
    throw error;
  }
};

// Start a new conversation
export const startConversation = async (participant_ids) => {
  try {
    const response = await api.post("/messaging/conversations", {
      participant_ids,
    });
    return response.data;
  } catch (error) {
    console.error("Error starting conversation:", error);
    throw error;
  }
};

export const createChannel = async (channelData) => {
  try {
    const response = await api.post("/messaging/channels", channelData);
    return response.data;
  } catch (error) {
    console.error("Error creating channel:", error);
    throw error;
  }
};
