import API from "./api";

// Get notifications
export const getNotifications = (page = 1, limit = 10) => {
  return API.get(`/notifications?page=${page}&limit=${limit}`);
};

// Get unread notification count
export const getUnreadCount = () => {
  return API.get("/notifications/unread-count");
};

// Mark one notification as read
export const markNotificationAsRead = (notificationId) => {
  return API.patch(`/notifications/${notificationId}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = () => {
  return API.patch("/notifications/read-all");
};

// Delete one notification
export const deleteNotification = (notificationId) => {
  return API.delete(`/notifications/${notificationId}`);
};