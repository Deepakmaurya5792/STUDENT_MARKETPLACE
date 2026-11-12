
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import ListingDetails from "./pages/ListingDetails";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateListing from "./pages/CreateListing";
import Listings from "./pages/Listings";
import Profile from "./pages/Profile";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";
import Chat from "./pages/Chat";
import Conversations from "./pages/Conversations";

import NotificationBell from "./components/NotificationBell";
import ProtectedRoute from "./components/ProtectedRoute";

// ============================================
// NAVBAR
// ============================================

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-blue-700"
    }`;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3">

        {/* LOGO */}

        <Link to="/listings" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            S
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              Student<span className="text-blue-600">Market</span>
            </h1>
            <p className="text-[10px] font-medium tracking-widest text-gray-400">
              CAMPUS MARKETPLACE
            </p>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}

        <div className="flex flex-wrap items-center gap-1">

          <NavLink to="/listings" className={linkClass}>
            Marketplace
          </NavLink>

          {!loading && user && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>

              <NavLink to="/my-listings" className={linkClass}>
                My Listings
              </NavLink>

              <NavLink to="/conversations" className={linkClass}>
                Messages
              </NavLink>
            </>
          )}

        </div>

        {/* RIGHT SIDE */}

        <div className="flex items-center gap-3">

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <>
              <Link
                to="/create-listing"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Sell Product
              </Link>

              <NotificationBell />

              <Link
                to="/profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-blue-100 font-bold text-blue-700 transition hover:border-blue-500"
                title="My Profile"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.name?.charAt(0)?.toUpperCase() || "U"
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Get Started
              </Link>
            </>
          )}

        </div>
      </nav>
    </header>
  );
};

// ============================================
// APP
// ============================================

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Navigate to="/listings" replace />}
        />

        {/* PUBLIC ROUTES */}

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetails />} />

        {/* PROTECTED ROUTES */}

        <Route element={<ProtectedRoute />}>

          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/create-listing"
            element={<CreateListing />}
          />

          <Route
            path="/chat/:conversationId"
            element={<Chat />}
          />

          <Route
            path="/conversations"
            element={<Conversations />}
          />

          <Route path="/profile" element={<Profile />} />

          <Route
            path="/my-listings"
            element={<MyListings />}
          />

          <Route
            path="/edit-listing/:id"
            element={<EditListing />}
          />

        </Route>

        {/* UNKNOWN ROUTES */}

        <Route
          path="*"
          element={<Navigate to="/listings" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
