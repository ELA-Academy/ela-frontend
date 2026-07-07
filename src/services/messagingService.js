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

// Send a new message (optionally replying to an existing message)
export const sendMessage = async (conversationId, content, replyToMessageId = null, mentions = []) => {
  try {
    const response = await api.post(
      `/messaging/conversations/${conversationId}/messages`,
      { content, reply_to_message_id: replyToMessageId, mentions }
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

export const getAuditConversations = async () => {
  try {
    const response = await api.get("/messaging/conversations/audit");
    return response.data;
  } catch (error) {
    console.error("Error fetching audit conversations:", error);
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

// Unfollow a channel (removes it from user's sidebar)
export const unfollowChannel = async (conversationId) => {
  try {
    const response = await api.post(`/messaging/conversations/${conversationId}/unfollow`);
    return response.data;
  } catch (error) {
    console.error("Error unfollowing channel:", error);
    throw error;
  }
};

// Mark a conversation as unread
export const markConversationUnread = async (conversationId) => {
  try {
    const response = await api.post(`/messaging/conversations/${conversationId}/mark-unread`);
    return response.data;
  } catch (error) {
    console.error("Error marking conversation as unread:", error);
    throw error;
  }
};

// Toggle favorite on a conversation
export const toggleFavoriteConversation = async (conversationId) => {
  try {
    const response = await api.post(`/messaging/conversations/${conversationId}/favorite`);
    return response.data;
  } catch (error) {
    console.error("Error toggling favorite on conversation:", error);
    throw error;
  }
};
