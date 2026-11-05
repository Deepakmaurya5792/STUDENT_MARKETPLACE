
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import ListingDetails from "./pages/ListingDetails";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateListing from "./pages/CreateListing";
import Listings from "./pages/Listings";
import Profile from "./pages/Profile";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";

import ProtectedRoute from "./components/ProtectedRoute";
import Chat from "./pages/Chat";
import Conversations from "./pages/Conversations";

function App() {
  return (
    <BrowserRouter>
      <nav className="flex flex-wrap items-center justify-center gap-8 bg-gray-900 p-4 text-white">

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

        <Link to="/listings" className="hover:text-blue-400">
          Marketplace
        </Link>

        <Link to="/conversations" className="hover:text-blue-400">
          Messages
        </Link>

        <Link to="/profile" className="hover:text-blue-400">
          Profile
        </Link>

      </nav>

      <Routes>

        <Route
          path="/"
          element={<Navigate to="/listings" replace />}
        />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetails />} />

        {/* Protected routes */}
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

          <Route
            path="/profile"
            element={<Profile />}
          />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />

        </Route>

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/listings" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
