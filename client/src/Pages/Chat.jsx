
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

import api from "../services/api";
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

  const [conversation, setConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(true);

  const messagesContainerRef = useRef(null);
  const previousScrollRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const initialPositionedRef = useRef(false);
  const loadingOlderRef = useRef(false);

  const currentUserId = (user?._id || user?.id)?.toString();

  // ============================================
  // FETCH CONVERSATION DETAILS
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const fetchConversation = async () => {
      try {
        setConversationLoading(true);

        const response = await api.get("/conversations");

        const conversations =
          response.data.data ||
          response.data.conversations ||
          [];

        const currentConversation = conversations.find(
          (item) => item._id?.toString() === conversationId
        );

        if (isMounted) {
          setConversation(currentConversation || null);
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);

        if (isMounted) {
          setConversation(null);
        }
      } finally {
        if (isMounted) {
          setConversationLoading(false);
        }
      }
    };

    fetchConversation();

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // ============================================
  // PARTICIPANT AND PRODUCT INFORMATION
  // ============================================

  const listing = conversation?.listing;

  const buyer = conversation?.buyer;
  const seller = conversation?.seller;

  const otherUser =
    buyer?._id?.toString() === currentUserId
      ? seller
      : buyer;

  const productImage = listing?.images?.[0]?.url;

  const formatPrice = () => {
    if (!listing) return "";

    if (listing.listingType === "free") return "Free";

    if (listing.price == null) return "Price unavailable";

    return `₹${listing.price}${
      listing.listingType === "rent" && listing.rentPeriod
        ? ` / ${listing.rentPeriod}`
        : ""
    }`;
  };

  // ============================================
  // ACKNOWLEDGE INCOMING MESSAGES
  // ============================================

  const acknowledgeMessages = (incomingMessages) => {
    if (!socket.connected || !currentUserId) return;

    incomingMessages.forEach((message) => {
      const senderId = (
        message.sender?._id || message.sender
      )?.toString();

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
  // SCROLL MANAGEMENT
  // ============================================

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;

    if (!container || loading) return;

    if (previousScrollRef.current) {
      const { scrollHeight, scrollTop } =
        previousScrollRef.current;

      container.scrollTop =
        container.scrollHeight - scrollHeight + scrollTop;

      previousScrollRef.current = null;
      return;
    }

    if (!initialPositionedRef.current) {
      container.scrollTop = container.scrollHeight;
      initialPositionedRef.current = true;
      return;
    }

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

        if (!socket.connected) {
          socket.connect();
        }

        const response = await getMessages(conversationId, {
          limit: 20,
        });

        if (!isMounted) return;

        const initialMessages = response.data.messages || [];

        setMessages(initialMessages);
        setHasMore(response.data.hasMore);
        setNextCursor(response.data.nextCursor);

        acknowledgeMessages(initialMessages);

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

    // NEW MESSAGE

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
        if (prev.some((item) => item._id === message._id)) {
          return prev;
        }

        return [...prev, message];
      });

      if (socket.connected) {
        socket.emit("message-delivered", {
          messageId: message._id,
          conversationId,
        });
      }

      try {
        await markMessagesRead(conversationId);
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    };

    // DELIVERY RECEIPT

    const handleMessageDelivered = ({
      conversationId: receivedId,
      messageId,
      deliveredAt,
    }) => {
      if (receivedId !== conversationId) return;

      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? { ...message, deliveredAt }
            : message
        )
      );
    };

    // READ RECEIPT

    const handleMessagesRead = ({
      conversationId: receivedId,
      readBy,
    }) => {
      if (receivedId !== conversationId) return;
      if (readBy === currentUserId) return;

      setMessages((prev) =>
        prev.map((message) => {
          const senderId = (
            message.sender?._id || message.sender
          )?.toString();

          if (senderId === currentUserId) {
            return { ...message, isRead: true };
          }

          return message;
        })
      );
    };

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
  // SCROLL HANDLER
  // ============================================

  const handleScroll = () => {
    const container = messagesContainerRef.current;

    if (container && container.scrollTop <= 50) {
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

      shouldAutoScrollRef.current = true;

      setMessages((prev) => {
        if (prev.some((item) => item._id === response.data._id)) {
          return prev;
        }

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
  // MESSAGE STATUS
  // ============================================

  const getMessageStatus = (message) => {
    if (message.isRead) {
      return {
        label: "Read",
        symbol: "✓✓",
        color: "text-blue-200",
      };
    }

    if (message.deliveredAt) {
      return {
        label: "Delivered",
        symbol: "✓✓",
        color: "text-white/60",
      };
    }

    return {
      label: "Sent",
      symbol: "✓",
      color: "text-white/60",
    };
  };

  // ============================================
  // MESSAGE TIME
  // ============================================

  const formatMessageTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 px-3 py-5 sm:px-6 sm:py-8">

      <div className="mx-auto flex h-[calc(100vh-120px)] min-h-[500px] max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* ================================== */}
        {/* TOP HEADER */}
        {/* ================================== */}

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">

          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Messages
            </h1>

            <p className="mt-0.5 text-xs text-gray-400">
              Your conversation
            </p>
          </div>

          <button
            onClick={() => navigate("/conversations")}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
          >
            ← All Chats
          </button>

        </div>

        {/* ================================== */}
        {/* PRODUCT AND PARTICIPANT HEADER */}
        {/* ================================== */}

        {conversationLoading ? (
          <div className="flex items-center gap-4 border-b border-gray-100 p-4">
            <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-slate-50/80 px-5 py-4 sm:px-6">

            {/* PRODUCT */}

            <div className="flex min-w-0 flex-1 items-center gap-3">

              {productImage ? (
                <img
                  src={productImage}
                  alt={listing?.title || "Product"}
                  className="h-14 w-14 shrink-0 rounded-xl border border-gray-200 bg-white object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-xs text-gray-500">
                  No Image
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Discussing product
                </p>

                <h2 className="mt-1 truncate text-sm font-bold text-gray-900">
                  {listing?.title || "Product unavailable"}
                </h2>

                <p className="mt-0.5 text-sm font-bold text-blue-600">
                  {formatPrice()}
                </p>
              </div>

            </div>

            {/* OTHER PARTICIPANT */}

            {otherUser && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">

                {otherUser.profileImage ? (
                  <img
                    src={otherUser.profileImage}
                    alt={otherUser.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                <div className="max-w-[130px]">
                  <p className="text-[10px] text-gray-400">
                    Chatting with
                  </p>

                  <p className="truncate text-sm font-semibold text-gray-800">
                    {otherUser.name || "Student"}
                  </p>
                </div>

              </div>
            )}

            {/* VIEW PRODUCT */}

            {listing?._id && (
              <button
                onClick={() =>
                  navigate(`/listings/${listing._id}`)
                }
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                View Product ↗
              </button>
            )}

          </div>
        )}

        {/* ================================== */}
        {/* ERROR MESSAGE */}
        {/* ================================== */}

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ================================== */}
        {/* MESSAGE AREA */}
        {/* ================================== */}

        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 space-y-5 overflow-y-auto bg-white px-4 py-6 sm:px-8"
        >

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <p className="mt-3 text-sm text-gray-400">
                  Loading conversation...
                </p>
              </div>
            </div>
          ) : (
            <>
              {loadingOlder && (
                <p className="text-center text-xs font-medium text-gray-400">
                  Loading older messages...
                </p>
              )}

              {messages.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
                    💬
                  </div>

                  <h3 className="mt-4 font-bold text-gray-800">
                    Start the conversation
                  </h3>

                  <p className="mt-2 max-w-xs text-sm text-gray-400">
                    Ask the seller about the product, price or availability.
                  </p>

                </div>
              ) : (
                messages.map((message) => {
                  const senderId = (
                    message.sender?._id || message.sender
                  )?.toString();

                  const isMine = senderId === currentUserId;

                  const status = isMine
                    ? getMessageStatus(message)
                    : null;

                  return (
                    <div
                      key={message._id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >

                      <div
                        className={`max-w-[85%] sm:max-w-[70%] ${
                          isMine
                            ? "items-end"
                            : "items-start"
                        }`}
                      >

                        {!isMine && (
                          <p className="mb-1.5 ml-1 text-xs font-semibold text-gray-500">
                            {message.sender?.name || "Student"}
                          </p>
                        )}

                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            isMine
                              ? "rounded-br-md bg-blue-600 text-white"
                              : "rounded-bl-md border border-gray-100 bg-slate-100 text-gray-800"
                          }`}
                        >

                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.text}
                          </p>

                          <div className="mt-1.5 flex items-center justify-end gap-2">

                            <span
                              className={`text-[10px] ${
                                isMine
                                  ? "text-white/70"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
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
                    </div>
                  );
                })
              )}
            </>
          )}

        </div>

        {/* ================================== */}
        {/* MESSAGE COMPOSER */}
        {/* ================================== */}

        <form
          onSubmit={handleSend}
          className="border-t border-gray-100 bg-white p-4 sm:px-6 sm:py-5"
        >

          <div className="flex items-center gap-3">

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your message..."
              maxLength={2000}
              disabled={loading || sending}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!text.trim() || sending || loading}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>
                {sending ? "Sending..." : "Send"}
              </span>

              {!sending && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 18 12m0 0-6-6m6 6-6 6"
                  />
                </svg>
              )}
            </button>

          </div>

          <p className="mt-2 text-center text-[10px] text-gray-400">
            Connect with students and discuss products directly.
          </p>

        </form>

      </div>
    </div>
  );
};

export default Chat;
