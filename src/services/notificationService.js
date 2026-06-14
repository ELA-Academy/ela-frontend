import api from "../utils/api";

/**
 * Fetch notifications with optional filtering.
 * @param {Object} params - Query params (unread_only: boolean, category: 'all'|'mention'|'assignment')
 */
export const getNotifications = async (params = {}) => {
  const response = await api.get("/notifications", { params });
  return response.data;
};

/**
 * Mark all unread notifications as read.
 */
export const markAllAsRead = async () => {
  const response = await api.post("/notifications/mark-all-as-read");
  return response.data;
};

/**
 * Mark a single notification as read.
 * @param {number} notificationId 
 */
export const markRead = async (notificationId) => {
  const response = await api.post(`/notifications/${notificationId}/read`);
  return response.data;
};
