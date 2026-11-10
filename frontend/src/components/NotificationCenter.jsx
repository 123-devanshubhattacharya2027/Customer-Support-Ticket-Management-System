import { useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const [notificationResponse, countResponse] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);

      setNotifications(notificationResponse.data.notifications || []);
      setUnreadCount(countResponse.data.unreadCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark all as read.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      await fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notification.");
    }
  };

  if (loading) {
    return <p className="p-4 text-gray-600">Loading notifications...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Notifications
          </h2>
          <p className="text-sm text-gray-500">
            You have {unreadCount} unread notification(s).
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </p>
      )}

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">You have no notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`rounded-lg border p-4 ${
                notification.isRead
                  ? "border-gray-200 bg-white"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {notification.title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>

                  {!notification.isRead && (
                    <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      Unread
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Mark read
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;