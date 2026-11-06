
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";

const NotificationBell = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // FETCH NOTIFICATIONS + SOCKET EVENTS
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications");

        if (!isMounted) return;

        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unreadCount || 0);
      } catch (err) {
        if (isMounted) {
          setError("Failed to load notifications");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // ============================================
    // HANDLE NEW NOTIFICATION
    // ============================================

    const handleNewNotification = async (notification) => {
      const conversationId =
        notification.relatedConversation?.toString();

      const isConversationOpen =
        conversationId &&
        location.pathname === `/chat/${conversationId}`;

      // If the recipient is already viewing this conversation
      if (isConversationOpen) {
        try {
          await api.patch(`/messages/${conversationId}/read`);

          if (!isMounted) return;

          setNotifications((prev) => [
            {
              ...notification,
              isRead: true,
            },
            ...prev.filter(
              (item) => item._id !== notification._id
            ),
          ]);

        } catch (err) {
          console.error(
            "Failed to mark notification as read:",
            err
          );
        }

        return;
      }

      // Normal notification behavior
      setNotifications((prev) => {
        if (prev.some((item) => item._id === notification._id)) {
          return prev;
        }

        return [notification, ...prev];
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // ============================================
    // HANDLE NOTIFICATIONS MARKED AS READ
    // ============================================

    const handleNotificationsRead = ({
      conversationId,
      unreadCount: nextUnreadCount,
    }) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.relatedConversation?.toString() ===
          conversationId?.toString()
            ? { ...notification, isRead: true }
            : notification
        )
      );

      if (typeof nextUnreadCount === "number") {
        setUnreadCount(nextUnreadCount);
      }
    };

    socket.on("new-notification", handleNewNotification);
    socket.on("notifications-read", handleNotificationsRead);

    if (!socket.connected) {
      socket.connect();
    }

    fetchNotifications();

    return () => {
      isMounted = false;

      socket.off("new-notification", handleNewNotification);
      socket.off("notifications-read", handleNotificationsRead);
    };
  }, [location.pathname]);

  // ============================================
  // MARK SINGLE NOTIFICATION AS READ
  // ============================================

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.patch(
          `/notifications/${notification._id}/read`
        );

        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true }
              : item
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setIsOpen(false);

      // Navigate to related page
      if (notification.relatedConversation) {
        navigate(`/chat/${notification.relatedConversation}`);
      } else if (notification.relatedListing) {
        navigate(`/listings/${notification.relatedListing}`);
      }
    } catch (err) {
      setError("Failed to open notification");
    }
  };

  // ============================================
  // MARK ALL AS READ
  // ============================================

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError("Failed to mark notifications as read");
    }
  };

  // ============================================
  // FORMAT DATE
  // ============================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================
  // UI
  // ============================================

  return (
    <div className="relative">

      {/* BELL BUTTON */}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-gray-700"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.311 6.022 23.848 23.848 0 0 0 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}

      {isOpen && (
        <>
          {/* Outside click overlay */}

          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close notification dropdown"
          />

          <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="font-bold text-gray-800">
                  Notifications
                </h2>

                <p className="text-xs text-gray-500">
                  {unreadCount} unread notifications
                </p>
              </div>

              <div className="flex items-center gap-3">

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-800"
                  aria-label="Close"
                >
                  ✕
                </button>

              </div>
            </div>

            {/* NOTIFICATION CONTENT */}

            <div className="max-h-96 overflow-y-auto">

              {loading ? (
                <p className="p-8 text-center text-sm text-gray-500">
                  Loading notifications...
                </p>
              ) : error ? (
                <p className="p-8 text-center text-sm text-red-600">
                  {error}
                </p>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mb-3 text-4xl">🔔</div>

                  <h3 className="font-semibold text-gray-800">
                    No notifications yet
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    When someone messages you, notifications will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() =>
                      handleNotificationClick(notification)
                    }
                    className={`flex w-full items-start gap-3 border-b p-4 text-left transition hover:bg-gray-50 ${
                      !notification.isRead
                        ? "bg-blue-50"
                        : "bg-white"
                    }`}
                  >

                    {/* SENDER IMAGE */}

                    {notification.sender?.profileImage ? (
                      <img
                        src={notification.sender.profileImage}
                        alt={notification.sender.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                        {notification.sender?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </div>
                    )}

                    {/* NOTIFICATION DETAILS */}

                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-semibold text-gray-800">
                        {notification.title}
                      </p>

                      <p className="mt-1 break-words text-sm text-gray-600">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        {formatDate(notification.createdAt)}
                      </p>

                    </div>

                    {/* UNREAD INDICATOR */}

                    {!notification.isRead && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    )}

                  </button>
                ))
              )}

            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default NotificationBell;
