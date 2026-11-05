
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // FETCH CURRENT USER
  // ============================================

  const fetchCurrentUser = async (shouldThrow = false) => {
    try {
      const response = await api.get("/auth/me", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      setUser(response.data.data);

      return response.data.data;

    } catch (error) {
      setUser(null);

      if (shouldThrow) {
        throw error;
      }

      return null;

    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // INITIAL AUTHENTICATION CHECK
  // ============================================

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // ============================================
  // LOGIN
  // ============================================

  const login = async (credentials) => {
    await api.post("/auth/login", credentials);

    const currentUser = await fetchCurrentUser(true);

    if (!currentUser) {
      throw new Error(
        "Unable to retrieve authenticated user"
      );
    }

    return currentUser;
  };

  // ============================================
  // LOGOUT
  // ============================================

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  // ============================================
  // UPDATE USER IN AUTH CONTEXT
  // ============================================

  const updateAuthUser = (updatedData) => {
    setUser((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...updatedData,
      };
    });
  };

  // ============================================
  // REFRESH USER
  // ============================================

  const refreshUser = () => fetchCurrentUser(true);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser,
    updateAuthUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// CUSTOM AUTH HOOK
// ============================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};

export default AuthContext;
