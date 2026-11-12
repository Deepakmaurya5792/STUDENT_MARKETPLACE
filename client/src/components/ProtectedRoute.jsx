
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Wait until authentication status is checked
  if (loading) {
    return <div className="p-8 text-center">Checking authentication...</div>;
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow authenticated users
  return <Outlet />;
}

export default ProtectedRoute;
