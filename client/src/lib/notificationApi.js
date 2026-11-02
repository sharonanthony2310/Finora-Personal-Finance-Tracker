
import api from "./api";

// Fetch all notifications and unread count
export const getNotifications = async () => {
  const response = await api.get("/notifications");

  return {
    notifications: response.data.notifications,
    unreadCount: response.data.unreadCount,
  };
};

// Check spending and generate budget alerts
export const checkSpendingAlerts = async () => {
  const response = await api.post(
    "/notifications/check-spending"
  );

  return response.data;
};

// Mark one notification as read
export const markNotificationAsRead = async (id) => {
  const response = await api.patch(
    `/notifications/${id}/read`
  );

  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch(
    "/notifications/read-all"
  );

  return response.data;
};

// Delete one notification
export const deleteNotification = async (id) => {
  const response = await api.delete(
    `/notifications/${id}`
  );

  return response.data;
};
