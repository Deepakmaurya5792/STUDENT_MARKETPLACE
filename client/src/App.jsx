
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateListing from "./pages/CreateListing";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <nav className="flex items-center justify-center gap-8 bg-gray-900 p-4 text-white">
        <Link to="/login" className="hover:text-blue-400">
          Login
        </Link>

        <Link to="/register" className="hover:text-blue-400">
          Register
        </Link>

        <Link to="/dashboard" className="hover:text-blue-400">
          Dashboard
        </Link>

        <Link to="/create-listing" className="hover:text-blue-400">
          Create Listing
        </Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/create-listing"
            element={<CreateListing />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
