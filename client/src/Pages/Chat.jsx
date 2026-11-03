
import {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
} from "react";

import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  getMessages,
  sendMessage,
  markMessagesRead,
} from "../services/messageService";

import socket from "../services/socket";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState("");

  const messagesContainerRef = useRef(null);

  const previousScrollRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const initialPositionedRef = useRef(false);
  const loadingOlderRef = useRef(false);

  const currentUserId = (user?._id || user?.id)?.toString();

  // ============================================
  // ACKNOWLEDGE INCOMING MESSAGES AS DELIVERED
  // ============================================

  const acknowledgeMessages = (incomingMessages) => {
    if (!socket.connected || !currentUserId) return;

    incomingMessages.forEach((message) => {
      const senderId = (
        message.sender?._id || message.sender
      )?.toString();

      // Only acknowledge messages received from others
      if (
        senderId &&
        senderId !== currentUserId &&
        !message.deliveredAt
      ) {
        socket.emit("message-delivered", {
          messageId: message._id,
          conversationId,
        });
      }
    });
  };

  // ============================================
  // HANDLE SCROLLING AFTER MESSAGES CHANGE
  // ============================================

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;

    if (!container || loading) return;

    // Preserve position when older messages are added
    if (previousScrollRef.current) {
      const { scrollHeight, scrollTop } =
        previousScrollRef.current;

      container.scrollTop =
        container.scrollHeight - scrollHeight + scrollTop;

      previousScrollRef.current = null;
      return;
    }

    // Open directly at the latest message
    if (!initialPositionedRef.current) {
      container.scrollTop = container.scrollHeight;
      initialPositionedRef.current = true;
      return;
    }

    // Scroll only when user is near the bottom
    if (shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  // ============================================
  // INITIALIZE CHAT AND SOCKET LISTENERS
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError("");

        setMessages([]);
        setHasMore(false);
        setNextCursor(null);

        initialPositionedRef.current = false;
        previousScrollRef.current = null;
        shouldAutoScrollRef.current = true;

        // Connect authenticated socket
        if (!socket.connected) {
          socket.connect();
        }

        // Fetch latest 20 messages
        const response = await getMessages(conversationId, {
          limit: 20,
        });

        if (!isMounted) return;

        const initialMessages = response.data.messages || [];

        setMessages(initialMessages);
        setHasMore(response.data.hasMore);
        setNextCursor(response.data.nextCursor);

        // Acknowledge previously received messages
        acknowledgeMessages(initialMessages);

        // Mark all incoming messages as read
        await markMessagesRead(conversationId);

        if (!isMounted) return;

      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load messages"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // ==========================================
    // HANDLE NEW INCOMING MESSAGE
    // ==========================================

    const handleNewMessage = async ({
      conversationId: receivedId,
      message,
    }) => {
      if (receivedId !== conversationId) return;

      const container = messagesContainerRef.current;

      const isNearBottom = container
        ? container.scrollHeight -
            container.scrollTop -
            container.clientHeight < 100
        : true;

      shouldAutoScrollRef.current = isNearBottom;

      setMessages((prev) => {
        const alreadyExists = prev.some(
          (item) => item._id === message._id
        );

        if (alreadyExists) return prev;

        return [...prev, message];
      });

      // Acknowledge delivery to server
      if (socket.connected) {
        socket.emit("message-delivered", {
          messageId: message._id,
          conversationId,
        });
      }

      // Mark incoming messages as read
      try {
        await markMessagesRead(conversationId);
      } catch (err) {
        console.error(
          "Failed to mark message as read:",
          err
        );
      }
    };

    // ==========================================
    // HANDLE DELIVERY RECEIPT
    // ==========================================

    const handleMessageDelivered = ({
      conversationId: receivedId,
      messageId,
      deliveredAt,
    }) => {
      if (receivedId !== conversationId) return;

      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? {
                ...message,
                deliveredAt,
              }
            : message
        )
      );
    };

    // ==========================================
    // HANDLE READ RECEIPT
    // ==========================================

    const handleMessagesRead = ({
      conversationId: receivedId,
      readBy,
    }) => {
      if (receivedId !== conversationId) return;

      // Only update receipts when another user
      // has read our messages
      if (readBy === currentUserId) return;

      setMessages((prev) =>
        prev.map((message) => {
          const senderId = (
            message.sender?._id || message.sender
          )?.toString();

          if (senderId === currentUserId) {
            return {
              ...message,
              isRead: true,
            };
          }

          return message;
        })
      );
    };

    // Register socket listeners
    socket.on("new-message", handleNewMessage);
    socket.on("message-delivered", handleMessageDelivered);
    socket.on("messages-read", handleMessagesRead);

    initializeChat();

    return () => {
      isMounted = false;

      socket.off("new-message", handleNewMessage);
      socket.off("message-delivered", handleMessageDelivered);
      socket.off("messages-read", handleMessagesRead);
    };

  }, [conversationId, currentUserId]);

  // ============================================
  // LOAD OLDER MESSAGES
  // ============================================

  const loadOlderMessages = async () => {
    if (
      loadingOlderRef.current ||
      !hasMore ||
      !nextCursor ||
      loading
    ) {
      return;
    }

    const container = messagesContainerRef.current;

    if (!container) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setError("");

    // Save current scroll position
    previousScrollRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };

    try {
      const response = await getMessages(conversationId, {
        limit: 20,
        before: nextCursor,
      });

      const olderMessages = response.data.messages || [];

      setMessages((prev) => {
        const existingIds = new Set(
          prev.map((message) => message._id)
        );

        const uniqueOlderMessages = olderMessages.filter(
          (message) => !existingIds.has(message._id)
        );

        return [...uniqueOlderMessages, ...prev];
      });

      // Acknowledge any previously undelivered messages
      acknowledgeMessages(olderMessages);

      setHasMore(response.data.hasMore);
      setNextCursor(response.data.nextCursor);

    } catch (err) {
      previousScrollRef.current = null;

      setError(
        err.response?.data?.message ||
          "Failed to load older messages"
      );
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  };

  // ============================================
  // DETECT SCROLL NEAR TOP
  // ============================================

  const handleScroll = () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    if (container.scrollTop <= 50) {
      loadOlderMessages();
    }
  };

  // ============================================
  // SEND MESSAGE
  // ============================================

  const handleSend = async (e) => {
    e.preventDefault();

    if (!text.trim() || sending) return;

    try {
      setSending(true);
      setError("");

      const response = await sendMessage(
        conversationId,
        text.trim()
      );

      // Sender should see their message immediately
      shouldAutoScrollRef.current = true;

      setMessages((prev) => {
        const alreadyExists = prev.some(
          (item) => item._id === response.data._id
        );

        if (alreadyExists) return prev;

        return [...prev, response.data];
      });

      setText("");

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  // ============================================
  // MESSAGE STATUS INDICATOR
  // ============================================

  const getMessageStatus = (message) => {
    if (message.isRead) {
      return {
        label: "Read",
        symbol: "✓✓",
        color: "text-blue-300",
      };
    }

    if (message.deliveredAt) {
      return {
        label: "Delivered",
        symbol: "✓✓",
        color: "text-gray-300",
      };
    }

    return {
      label: "Sent",
      symbol: "✓",
      color: "text-gray-300",
    };
  };

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto flex h-[80vh] max-w-3xl flex-col rounded-xl bg-white shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h1 className="text-xl font-bold">
            Chat
          </h1>

          <button
            onClick={() => navigate("/listings")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Marketplace
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Messages container */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 space-y-4 overflow-y-auto p-5"
        >
          {loading ? (
            <p className="text-center text-gray-500">
              Loading messages...
            </p>
          ) : (
            <>
              {/* Older messages loading indicator */}
              {loadingOlder && (
                <p className="text-center text-sm text-gray-500">
                  Loading older messages...
                </p>
              )}

              {messages.length === 0 ? (
                <p className="text-center text-gray-500">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((message) => {
                  const senderId = (
                    message.sender?._id || message.sender
                  )?.toString();

                  const isMine =
                    senderId === currentUserId;

                  const status = isMine
                    ? getMessageStatus(message)
                    : null;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          isMine
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="mb-1 text-xs font-semibold opacity-75">
                          {isMine
                            ? "You"
                            : message.sender?.name ||
                              "Other user"}
                        </p>

                        <p className="break-words">
                          {message.text}
                        </p>

                        <div className="mt-1 flex items-center justify-end gap-2">
                          <span className="text-xs opacity-70">
                            {new Date(
                              message.createdAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {isMine && (
                            <span
                              title={status.label}
                              className={`text-xs font-bold ${status.color}`}
                            >
                              {status.symbol}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Send message form */}
        <form
          onSubmit={handleSend}
          className="flex gap-3 border-t p-4"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            maxLength={2000}
            className="flex-1 rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Chat;
