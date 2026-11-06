
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import socket from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { getMyListings } from "../services/listingService";
import { getMyProfile } from "../services/profileService";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    reserved: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // ============================================
  // UNREAD MESSAGE COUNT
  // ============================================

  const unreadMessages = recentConversations.reduce(
    (total, conversation) =>
      total + (conversation.unreadCount || 0),
    0
  );

  // ============================================
  // FETCH DASHBOARD DATA
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          getMyProfile(),
          getMyListings({ page: 1, limit: 4 }),
          getMyListings({ page: 1, limit: 1, status: "active" }),
          getMyListings({ page: 1, limit: 1, status: "reserved" }),
          getMyListings({ page: 1, limit: 1, status: "completed" }),
          api.get("/conversations"),
        ]);

        if (!isMounted) return;

        const [
          profileResult,
          recentResult,
          activeResult,
          reservedResult,
          completedResult,
          conversationsResult,
        ] = results;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value.data);
        }

        if (recentResult.status === "fulfilled") {
          setRecentListings(recentResult.value.data || []);

          setStats((prev) => ({
            ...prev,
            total:
              recentResult.value.pagination?.totalListings || 0,
          }));
        }

        if (activeResult.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            active:
              activeResult.value.pagination?.totalListings || 0,
          }));
        }

        if (reservedResult.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            reserved:
              reservedResult.value.pagination?.totalListings || 0,
          }));
        }

        if (completedResult.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            completed:
              completedResult.value.pagination?.totalListings || 0,
          }));
        }

        if (conversationsResult.status === "fulfilled") {
          setRecentConversations(
            conversationsResult.value.data.data || []
          );
        }

        if (results.every((result) => result.status === "rejected")) {
          setError("Unable to load dashboard data.");
        }
      } catch (err) {
        if (isMounted) {
          setError("Something went wrong while loading dashboard.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // ============================================
    // SOCKET: NEW MESSAGE
    // ============================================

    const handleNewMessage = ({ conversationId, message }) => {
      setRecentConversations((prev) => {
        const updated = prev.map((conversation) => {
          if (conversation._id !== conversationId) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: message,
            unreadCount: (conversation.unreadCount || 0) + 1,
            updatedAt: message.createdAt || new Date().toISOString(),
          };
        });

        return updated.sort(
          (a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    // ============================================
    // SOCKET: MESSAGES READ
    // ============================================

    const handleMessagesRead = ({ conversationId }) => {
      setRecentConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
    };

    socket.on("new-message", handleNewMessage);
    socket.on("messages-read", handleMessagesRead);

    if (!socket.connected) {
      socket.connect();
    }

    fetchDashboardData();

    return () => {
      isMounted = false;

      socket.off("new-message", handleNewMessage);
      socket.off("messages-read", handleMessagesRead);
    };
  }, []);

  // ============================================
  // GET OTHER USER
  // ============================================

  const getOtherUser = (conversation) => {
    const currentUserId = user?.id || user?._id;

    const isBuyer =
      conversation.buyer?._id?.toString() ===
      currentUserId?.toString();

    return isBuyer
      ? conversation.seller
      : conversation.buyer;
  };

  // ============================================
  // FORMAT DATE
  // ============================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError("Failed to logout. Please try again.");
      setLoggingOut(false);
    }
  };

  // ============================================
  // FORMAT PRICE
  // ============================================

  const formatPrice = (listing) => {
    if (listing.listingType === "free") {
      return "Free";
    }

    return `₹${listing.price}`;
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-500">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  // ============================================
  // DASHBOARD UI
  // ============================================

  const collegeName =
    profile?.college?.name ||
    user?.college?.name ||
    "College information unavailable";

  const profileImage =
    profile?.profileImage || user?.profileImage;

  const studentName =
    profile?.name || user?.name || "Student";

  const statCards = [
    {
      title: "Total Listings",
      value: stats.total,
      color: "bg-blue-100 text-blue-700",
      icon: "📦",
    },
    {
      title: "Active Listings",
      value: stats.active,
      color: "bg-green-100 text-green-700",
      icon: "🟢",
    },
    {
      title: "Reserved",
      value: stats.reserved,
      color: "bg-yellow-100 text-yellow-700",
      icon: "⏳",
    },
    {
      title: "Completed",
      value: stats.completed,
      color: "bg-purple-100 text-purple-700",
      icon: "✓",
    },
    {
      title: "Unread Messages",
      value: unreadMessages,
      color: "bg-red-100 text-red-700",
      icon: "💬",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">

        {/* WELCOME SECTION */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-lg sm:p-8">

          <div>
            <p className="text-blue-100">
              Student Marketplace
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Welcome, {studentName}!
            </h1>

            <p className="mt-2 text-blue-100">
              Manage your listings and explore your marketplace.
            </p>
          </div>

          <div className="flex items-center gap-4">

            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-16 w-16 rounded-full border-4 border-white/30 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                {studentName.charAt(0).toUpperCase()}
              </div>
            )}

            <button
              onClick={() => navigate("/profile")}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              My Profile
            </button>

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ACCOUNT INFORMATION */}

        <section className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-bold text-gray-800">
            Student Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="mt-1 font-semibold text-gray-800">
                {studentName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 break-all font-semibold text-gray-800">
                {profile?.email || user?.email || "Unavailable"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">College</p>
              <p className="mt-1 font-semibold text-gray-800">
                {collegeName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Branch</p>
              <p className="mt-1 font-semibold text-gray-800">
                {profile?.branch || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Academic Year</p>
              <p className="mt-1 font-semibold text-gray-800">
                {profile?.academicYear
                  ? `Year ${profile.academicYear}`
                  : "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Account Role</p>
              <p className="mt-1 font-semibold capitalize text-gray-800">
                {profile?.role || user?.role || "Student"}
              </p>
            </div>

          </div>
        </section>

        {/* STATISTICS */}

        <section className="mb-8">
          <h2 className="mb-5 text-xl font-bold text-gray-800">
            Overview
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">

            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-gray-500">
                      {card.title}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold text-gray-800">
                      {card.value}
                    </h3>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${card.color}`}
                  >
                    {card.icon}
                  </div>

                </div>
              </div>
            ))}

          </div>
        </section>

        {/* QUICK ACTIONS */}

        <section className="mb-8">
          <h2 className="mb-5 text-xl font-bold text-gray-800">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <button
              onClick={() => navigate("/create-listing")}
              className="rounded-xl bg-blue-600 p-5 text-left text-white shadow transition hover:bg-blue-700"
            >
              <span className="text-2xl">➕</span>
              <h3 className="mt-3 font-bold">Create Listing</h3>
              <p className="mt-1 text-sm text-blue-100">
                Sell, rent or exchange products.
              </p>
            </button>

            <button
              onClick={() => navigate("/my-listings")}
              className="rounded-xl bg-white p-5 text-left shadow transition hover:shadow-lg"
            >
              <span className="text-2xl">📦</span>
              <h3 className="mt-3 font-bold text-gray-800">
                My Listings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your products.
              </p>
            </button>

            <button
              onClick={() => navigate("/listings")}
              className="rounded-xl bg-white p-5 text-left shadow transition hover:shadow-lg"
            >
              <span className="text-2xl">🔍</span>
              <h3 className="mt-3 font-bold text-gray-800">
                Marketplace
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Discover products from students.
              </p>
            </button>

            <button
              onClick={() => navigate("/conversations")}
              className="relative rounded-xl bg-white p-5 text-left shadow transition hover:shadow-lg"
            >
              {unreadMessages > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
                  {unreadMessages}
                </span>
              )}

              <span className="text-2xl">💬</span>
              <h3 className="mt-3 font-bold text-gray-800">
                Messages
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Chat with other students.
              </p>
            </button>

          </div>
        </section>

        {/* RECENT CONVERSATIONS */}

        <section className="mb-8 rounded-xl bg-white p-6 shadow">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Recent Conversations
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest chats with other students.
              </p>
            </div>

            <button
              onClick={() => navigate("/conversations")}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View All →
            </button>
          </div>

          {recentConversations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                You don't have any conversations yet.
              </p>

              <button
                onClick={() => navigate("/listings")}
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Explore Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-3">

              {recentConversations.slice(0, 4).map((conversation) => {
                const otherUser = getOtherUser(conversation);
                const listing = conversation.listing;
                const lastMessage = conversation.lastMessage;
                const unreadCount = conversation.unreadCount || 0;

                return (
                  <div
                    key={conversation._id}
                    onClick={() =>
                      navigate(`/chat/${conversation._id}`)
                    }
                    className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition hover:bg-gray-50 sm:gap-4 sm:p-4"
                  >

                    {/* PROFILE IMAGE */}

                    {otherUser?.profileImage ? (
                      <img
                        src={otherUser.profileImage}
                        alt={otherUser.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                        {otherUser?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}

                    {/* CONVERSATION DETAILS */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center justify-between gap-2">

                        <h3 className="truncate font-semibold text-gray-800">
                          {otherUser?.name || "Unknown User"}
                        </h3>

                        <span className="shrink-0 text-xs text-gray-400">
                          {formatDate(
                            lastMessage?.createdAt ||
                            conversation.updatedAt
                          )}
                        </span>

                      </div>

                      <p className="truncate text-xs text-gray-500">
                        {listing?.title || "Listing unavailable"}
                      </p>

                      <p
                        className={`mt-1 truncate text-sm ${
                          unreadCount > 0
                            ? "font-semibold text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {lastMessage?.text || "Start a conversation"}
                      </p>

                    </div>

                    {/* UNREAD BADGE */}

                    {unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}

                    <span className="hidden shrink-0 text-sm font-medium text-blue-600 sm:block">
                      Open →
                    </span>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* RECENT LISTINGS */}

        <section className="mb-8 rounded-xl bg-white p-6 shadow">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-800">
              Recent Listings
            </h2>

            <button
              onClick={() => navigate("/my-listings")}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View All →
            </button>
          </div>

          {recentListings.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500">
                You haven't created any listings yet.
              </p>

              <button
                onClick={() => navigate("/create-listing")}
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {recentListings.map((listing) => (
                <div
                  key={listing._id}
                  className="overflow-hidden rounded-xl border"
                >

                  {listing.images?.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gray-100 text-gray-500">
                      No Image
                    </div>
                  )}

                  <div className="p-4">

                    <h3 className="truncate font-semibold text-gray-800">
                      {listing.title}
                    </h3>

                    <p className="mt-2 font-bold text-blue-600">
                      {formatPrice(listing)}
                    </p>

                    <span
                      className={`mt-3 inline-block rounded-full px-3 py-1 text-xs capitalize ${
                        listing.status === "active"
                          ? "bg-green-100 text-green-700"
                          : listing.status === "reserved"
                          ? "bg-yellow-100 text-yellow-700"
                          : listing.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {listing.status}
                    </span>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* LOGOUT */}

        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

      </div>
    </main>
  );
};

export default Dashboard;
