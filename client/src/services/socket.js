
import { io } from "socket.io-client";

// Resolves WebSocket server URL:
// 1. VITE_SOCKET_URL or VITE_API_URL (split deployment)
// 2. window.location.origin in production (monolithic deploy)
// 3. http://localhost:5000 fallback (local development)
const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");
  }
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return "http://localhost:5000";
};

const socket = io(getSocketURL(), {
  withCredentials: true,
  autoConnect: false,
});

export default socket;
