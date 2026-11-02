
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  getMessages,
  sendMessage,
} from "../services/messageService";

import socket from "../services/socket";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError("");

        // Load previous messages
        const response = await getMessages(conversationId);

        if (!isMounted) return;

        setMessages(response.data || []);

        // Connect authenticated socket
        if (!socket.connected) {
          socket.connect();
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Failed to load messages"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const handleNewMessage = ({ conversationId: receivedId, message }) => {
      if (receivedId !== conversationId) return;

      setMessages((prev) => {
        const alreadyExists = prev.some(
          (item) => item._id === message._id
        );

        if (alreadyExists) return prev;

        return [...prev, message];
      });
    };

    socket.on("new-message", handleNewMessage);

    initializeChat();

    return () => {
      isMounted = false;
      socket.off("new-message", handleNewMessage);
    };
  }, [conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!text.trim() || sending) return;

    try {
      setSending(true);
      setError("");

      const response = await sendMessage(conversationId, text.trim());

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
        err.response?.data?.message || "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto flex h-[80vh] max-w-3xl flex-col rounded-xl bg-white shadow-lg">

        <div className="flex items-center justify-between border-b p-4">
          <h1 className="text-xl font-bold">Chat</h1>

          <button
            onClick={() => navigate("/listings")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Marketplace
          </button>
        </div>

        {error && (
          <p className="bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading ? (
            <p className="text-center text-gray-500">
              Loading messages...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message) => {
              const senderId =
                message.sender?._id || message.sender;

              const isMine =
                senderId?.toString() === user?._id?.toString() ||
                senderId?.toString() === user?.id?.toString();

              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
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
                      {isMine ? "You" : message.sender?.name || "Other user"}
                    </p>

                    <p className="break-words">{message.text}</p>

                    <p className="mt-1 text-right text-xs opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
