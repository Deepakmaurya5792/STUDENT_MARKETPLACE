
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";

const Conversations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/conversations");

        if (isMounted) {
          setConversations(response.data.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load conversations."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const handleNewMessage = ({ conversationId, message }) => {
      setConversations((prev) => {
        const updated = prev.map((conversation) => {
          if (conversation._id !== conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: message,
            unreadCount: (conversation.unreadCount || 0) + 1,
            updatedAt: message.createdAt,
          };
        });

        return updated.sort(
          (a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    const handleMessagesRead = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
    };

    socket.on("new-message", handleNewMessage);
    socket.on("messages-read", handleMessagesRead);

    if (!socket.connected) {
      socket.connect();
    }

    fetchConversations();

    return () => {
      isMounted = false;
      socket.off("new-message", handleNewMessage);
      socket.off("messages-read", handleMessagesRead);
    };
  }, []);

  const getOtherUser = (conversation) => {
    const currentUserId = user?.id || user?._id;

    const isBuyer =
      conversation.buyer?._id?.toString() ===
      currentUserId?.toString();

    return isBuyer ? conversation.seller : conversation.buyer;
  };

  const formatDate = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);

    if (Number.isNaN(messageDate.getTime())) return "";

    const today = new Date();
    const isToday =
      messageDate.toDateString() === today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isYesterday =
      messageDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (isYesterday) return "Yesterday";

    return messageDate.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  };

  const totalUnread = conversations.reduce(
    (total, conversation) =>
      total + (conversation.unreadCount || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="h-16 w-16 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            CAMPUS MESSAGES
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                My Messages
              </h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Your conversations with other students.
              </p>
            </div>

            {totalUnread > 0 && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2">
                <p className="text-xs font-medium text-blue-600">
                  Unread messages
                </p>
                <p className="text-xl font-bold text-blue-700">
                  {totalUnread}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 text-sm font-semibold text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && conversations.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h8m-8 4h5m-8 6l-1-4a8 8 0 111.5 1.5L5 20z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              No conversations yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              When you contact a seller or someone messages you,
              your conversations will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/listings")}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Explore Listings
            </button>
          </div>
        )}

        {/* Conversation List */}
        {conversations.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">
                All Conversations
              </h2>
              <span className="text-xs font-medium text-slate-400">
                {conversations.length}{" "}
                {conversations.length === 1
                  ? "conversation"
                  : "conversations"}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                const listing = conversation.listing;
                const lastMessage = conversation.lastMessage;
                const unreadCount = conversation.unreadCount || 0;

                return (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() =>
                      navigate(`/chat/${conversation._id}`)
                    }
                    className="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-5"
                  >
                    {/* Listing Image */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-20 sm:w-20">
                      {listing?.images?.length > 0 ? (
                        <img
                          src={listing.images[0].url}
                          alt={listing.title || "Listing"}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Conversation Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                          {otherUser?.name || "Unknown User"}
                        </h3>

                        {unreadCount > 0 && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-xs font-medium text-blue-600 sm:text-sm">
                        {listing?.title || "Listing unavailable"}
                      </p>

                      <p
                        className={`mt-2 truncate text-xs sm:text-sm ${
                          unreadCount > 0
                            ? "font-semibold text-slate-900"
                            : "text-slate-500"
                        }`}
                      >
                        {lastMessage?.text ||
                          "Start a conversation"}
                      </p>
                    </div>

                    {/* Date and Unread Count */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-[10px] text-slate-400 sm:text-xs">
                        {formatDate(
                          lastMessage?.createdAt ||
                            conversation.updatedAt
                        )}
                      </span>

                      {unreadCount > 0 && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="hidden h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600 sm:block"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
