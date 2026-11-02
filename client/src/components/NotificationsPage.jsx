
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

import {
  getNotifications,
  checkSpendingAlerts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../lib/notificationApi";

const notificationStyles = {
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    background: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  danger: {
    icon: AlertCircle,
    color: "text-rose-400",
    background: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  success: {
    icon: CheckCircle,
    color: "text-emerald-400",
    background: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  info: {
    icon: Info,
    color: "text-indigo-400",
    background: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
};

function formatDate(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchNotifications = async () => {
    try {
      setError("");

      const data = await getNotifications();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  // Check spending before loading notifications
  const initializeNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      await checkSpendingAlerts();
      await fetchNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to check spending alerts."
      );

      await fetchNotifications();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeNotifications();
  }, []);

  // Refresh notifications
  const handleRefresh = async () => {
    setRefreshing(true);
    setSuccess("");

    try {
      await checkSpendingAlerts();
      await fetchNotifications();
      setSuccess("Notifications refreshed.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to refresh notifications."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Mark one notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update notification."
      );
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
      setSuccess("All notifications marked as read.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update notifications."
      );
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    try {
      const notification = notifications.find(
        (item) => item._id === id
      );

      await deleteNotification(id);

      setNotifications((previous) =>
        previous.filter((item) => item._id !== id)
      );

      if (notification && !notification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      setSuccess("Notification deleted.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete notification."
      );
    }
  };

  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  );

  const readNotifications = notifications.filter(
    (notification) => notification.isRead
  );

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400">
                {unreadCount} unread
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Stay informed about your financial activity and spending limits.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              <CheckCheck size={17} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Notifications"
          value={notifications.length}
          icon={Bell}
        />

        <SummaryCard
          label="Unread"
          value={unreadCount}
          icon={AlertCircle}
        />

        <SummaryCard
          label="Read"
          value={readNotifications.length}
          icon={CheckCircle}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-12 text-center text-slate-400">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111B2E] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
            <Bell size={28} className="text-indigo-400" />
          </div>

          <h2 className="text-lg font-semibold text-white">
            You're all caught up!
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            You don't have any notifications right now.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Unread notifications */}
          {unreadNotifications.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                New notifications
              </h2>

              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Read notifications */}
          {readNotifications.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Earlier notifications
              </h2>

              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// Individual notification card
function NotificationCard({ notification, onRead, onDelete }) {
  const style =
    notificationStyles[notification.type] ||
    notificationStyles.info;

  const Icon = style.icon;

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-start sm:justify-between ${
        notification.isRead
          ? "border-slate-800 bg-[#111B2E]"
          : "border-indigo-500/20 bg-[#111B2E]"
      }`}
    >
      <div className="flex min-w-0 gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.background}`}
        >
          <Icon size={21} className={style.color} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">
              {notification.title}
            </h3>

            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {notification.message}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            {formatDate(notification.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        {!notification.isRead && (
          <button
            onClick={() => onRead(notification._id)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Mark as read
          </button>
        )}

        <button
          onClick={() => onDelete(notification._id)}
          title="Delete notification"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

// Summary card
function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>

        <Icon size={20} className="text-indigo-400" />
      </div>

      <p className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}
