import axios from "axios";

// Resolves API URL based on environment:
// 1. VITE_API_URL if set (for split deployment e.g. Vercel + Render)
// 2. /api relative URL in production (for monolithic single-host deployment)
// 3. http://localhost:5000/api fallback for local development
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  if (import.meta.env.PROD) {
    return "/api";
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

export default api;
