import api from "../utils/api";

export const getNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await api.post("/notifications/mark-all-as-read");
    return response.data;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};
