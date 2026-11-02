
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
        const response = await api.get("/conversations");

        if (isMounted) {
          setConversations(response.data.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load conversations"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Handle new incoming messages
    const handleNewMessage = ({
      conversationId,
      message,
    }) => {
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

    // Handle messages being marked as read
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

    return isBuyer
      ? conversation.seller
      : conversation.buyer;
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <p className="py-20 text-center">
        Loading conversations...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">

        <h1 className="mb-2 text-3xl font-bold">
          My Messages
        </h1>

        <p className="mb-8 text-gray-600">
          Your conversations with other students.
        </p>

        {error ? (
          <p className="text-center text-red-600">
            {error}
          </p>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold">
              No conversations yet
            </h2>

            <p className="mt-2 text-gray-500">
              Contact a seller to start a conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const listing = conversation.listing;
              const lastMessage = conversation.lastMessage;
              const unreadCount = conversation.unreadCount || 0;

              return (
                <div
                  key={conversation._id}
                  onClick={() =>
                    navigate(`/chat/${conversation._id}`)
                  }
                  className="flex cursor-pointer items-center gap-4 rounded-xl bg-white p-4 shadow transition hover:shadow-lg"
                >
                  {/* Listing Image */}
                  {listing?.images?.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500">
                      No Image
                    </div>
                  )}

                  {/* Conversation Information */}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">
                      {otherUser?.name || "Unknown User"}
                    </h2>

                    <p className="truncate text-sm text-gray-500">
                      {listing?.title || "Listing unavailable"}
                    </p>

                    <p
                      className={`mt-2 truncate text-sm ${
                        unreadCount > 0
                          ? "font-semibold text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {lastMessage?.text ||
                        "Start a conversation"}
                    </p>
                  </div>

                  {/* Date and Unread Badge */}
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <p className="text-xs text-gray-400">
                      {formatDate(
                        lastMessage?.createdAt ||
                          conversation.updatedAt
                      )}
                    </p>

                    {unreadCount > 0 && (
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        {unreadCount} New
                      </span>
                    )}

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                      Open Chat
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
