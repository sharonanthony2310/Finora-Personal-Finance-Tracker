
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Check,
} from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
} from "../lib/notificationApi";

const styles = {
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    background: "bg-amber-500/10",
  },
  danger: {
    icon: AlertCircle,
    color: "text-rose-400",
    background: "bg-rose-500/10",
  },
  success: {
    icon: CheckCircle,
    color: "text-emerald-400",
    background: "bg-emerald-500/10",
  },
  info: {
    icon: Info,
    color: "text-indigo-400",
    background: "bg-indigo-500/10",
  },
};

export default function NotificationBell({ onCountChange }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const data = await getNotifications();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);

      onCountChange?.(data.unreadCount || 0);
    } catch (error) {
      console.error("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

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

      setUnreadCount((previous) => {
        const nextCount = Math.max(0, previous - 1);
        onCountChange?.(nextCount);
        return nextCount;
      });
    } catch (error) {
      console.error("Unable to mark notification as read.");
    }
  };

  const openNotificationsPage = () => {
    setOpen(false);
    navigate("/");
    // The dashboard will switch to the Notifications section
    window.dispatchEvent(
      new CustomEvent("finora:open-notifications")
    );
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Open notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-[70] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-700 bg-[#111B2E] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h3 className="font-semibold text-white">
                Notifications
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {unreadCount} unread
              </p>
            </div>

            <button
              onClick={fetchNotifications}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Loading notifications...
              </p>
            ) : recentNotifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Bell
                  size={28}
                  className="mx-auto mb-3 text-slate-600"
                />

                <p className="text-sm text-slate-300">
                  No notifications yet.
                </p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const style =
                  styles[notification.type] || styles.info;

                const Icon = style.icon;

                return (
                  <div
                    key={notification._id}
                    className={`flex gap-3 border-b border-slate-800/70 px-5 py-4 ${
                      notification.isRead ? "" : "bg-indigo-500/5"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.background}`}
                    >
                      <Icon size={17} className={style.color} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {notification.message}
                      </p>

                      {!notification.isRead && (
                        <button
                          onClick={() =>
                            handleMarkAsRead(notification._id)
                          }
                          className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                        >
                          <Check size={13} />
                          Mark as read
                        </button>
                      )}
                    </div>

                    {!notification.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={openNotificationsPage}
            className="w-full border-t border-slate-800 px-5 py-4 text-center text-sm font-medium text-indigo-400 transition hover:bg-slate-800/50"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
