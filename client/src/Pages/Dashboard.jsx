
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

    // SOCKET: NEW MESSAGE

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

    // SOCKET: MESSAGES READ

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
    const currentUserId = user?._id || user?.id;

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
  // FORMAT PRICE
  // ============================================

  const formatPrice = (listing) => {
    if (listing.listingType === "free") {
      return "Free";
    }

    if (listing.price == null) {
      return "Price unavailable";
    }

    return `₹${listing.price}${
      listing.listingType === "rent" && listing.rentPeriod
        ? ` / ${listing.rentPeriod}`
        : ""
    }`;
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
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-44 rounded-3xl bg-gray-200" />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-2xl bg-gray-200"
              />
            ))}
          </div>

          <div className="h-64 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  // ============================================
  // USER INFORMATION
  // ============================================

  const studentName =
    profile?.name || user?.name || "Student";

  const collegeName =
    profile?.college?.name ||
    user?.college?.name ||
    "College information unavailable";

  const profileImage =
    profile?.profileImage || user?.profileImage;

  const statCards = [
    {
      title: "Total Listings",
      value: stats.total,
      icon: "📦",
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Active Listings",
      value: stats.active,
      icon: "🟢",
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Reserved",
      value: stats.reserved,
      icon: "⏳",
      color: "bg-amber-50 text-amber-700",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: "✓",
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "Unread Messages",
      value: unreadMessages,
      icon: "💬",
      color: "bg-red-50 text-red-700",
    },
  ];

  // ============================================
  // DASHBOARD UI
  // ============================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADING */}

        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Student Marketplace
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your products, conversations and account.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* WELCOME CARD */}

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-sm sm:p-8">

          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-6">

            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
                Your campus marketplace
              </span>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Welcome back, {studentName}!
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100 sm:text-base">
                Buy, sell and connect with students from your campus and beyond.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/create-listing")}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  + Sell a Product
                </button>

                <button
                  onClick={() => navigate("/listings")}
                  className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Explore Marketplace
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={studentName}
                  className="h-16 w-16 rounded-full border-2 border-white/50 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                  {studentName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="max-w-[180px]">
                <p className="font-bold">{studentName}</p>
                <p className="mt-1 truncate text-xs text-blue-100">
                  {collegeName}
                </p>

                <button
                  onClick={() => navigate("/profile")}
                  className="mt-2 text-xs font-bold text-white underline underline-offset-4 hover:text-blue-100"
                >
                  Edit Profile
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* OVERVIEW */}

        <section className="mb-9">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Your Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                A quick look at your marketplace activity.
              </p>
            </div>

            <button
              onClick={() => navigate("/my-listings")}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Manage Listings →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${card.color}`}>
                    {card.icon}
                  </span>
                </div>

                <h3 className="mt-5 text-3xl font-extrabold text-gray-900">
                  {card.value}
                </h3>

                <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
                  {card.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* STUDENT INFORMATION */}

        <section className="mb-9 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Student Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your account details.
              </p>
            </div>

            <button
              onClick={() => navigate("/profile")}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              Edit
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {[
              {
                label: "Full Name",
                value: studentName,
              },
              {
                label: "Email Address",
                value: profile?.email || user?.email || "Unavailable",
              },
              {
                label: "College",
                value: collegeName,
              },
              {
                label: "Branch",
                value: profile?.branch || "Not provided",
              },
              {
                label: "Academic Year",
                value: profile?.academicYear
                  ? `Year ${profile.academicYear}`
                  : "Not provided",
              },
              {
                label: "Account Role",
                value: profile?.role || user?.role || "Student",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-xl bg-slate-50 p-4"
              >
                <p className="text-xs font-medium text-gray-400">
                  {item.label}
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-gray-800">
                  {item.value}
                </p>
              </div>
            ))}

          </div>
        </section>

        {/* QUICK ACTIONS */}

        <section className="mb-9">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Get where you need to go.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <button
              onClick={() => navigate("/create-listing")}
              className="group rounded-2xl border border-blue-100 bg-blue-600 p-5 text-left text-white shadow-sm transition hover:-translate-y-1 hover:bg-blue-700 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
                +
              </span>

              <h3 className="mt-4 font-bold">
                Sell a Product
              </h3>

              <p className="mt-1 text-xs leading-5 text-blue-100">
                Create a new product listing.
              </p>
            </button>

            <button
              onClick={() => navigate("/my-listings")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                📦
              </span>

              <h3 className="mt-4 font-bold text-gray-900">
                My Listings
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Manage your uploaded products.
              </p>
            </button>

            <button
              onClick={() => navigate("/listings")}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                🔍
              </span>

              <h3 className="mt-4 font-bold text-gray-900">
                Marketplace
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Find products listed by students.
              </p>
            </button>

            <button
              onClick={() => navigate("/conversations")}
              className="relative rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {unreadMessages > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                  {unreadMessages}
                </span>
              )}

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl">
                💬
              </span>

              <h3 className="mt-4 font-bold text-gray-900">
                Messages
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Chat with other students.
              </p>
            </button>

          </div>
        </section>

        {/* RECENT CONVERSATIONS */}

        <section className="mb-9 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
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
            <div className="rounded-xl bg-slate-50 px-5 py-10 text-center">
              <div className="text-3xl">💬</div>

              <h3 className="mt-3 font-semibold text-gray-800">
                No conversations yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Start a conversation with a seller from the Marketplace.
              </p>

              <button
                onClick={() => navigate("/listings")}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Explore Marketplace
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {recentConversations.slice(0, 4).map((conversation) => {
                const otherUser = getOtherUser(conversation);
                const listing = conversation.listing;
                const lastMessage = conversation.lastMessage;
                const unreadCount = conversation.unreadCount || 0;

                return (
                  <button
                    key={conversation._id}
                    onClick={() =>
                      navigate(`/chat/${conversation._id}`)
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-4 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-3"
                  >

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

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-bold text-gray-900">
                          {otherUser?.name || "Unknown User"}
                        </h3>

                        <span className="shrink-0 text-[11px] text-gray-400">
                          {formatDate(
                            lastMessage?.createdAt ||
                              conversation.updatedAt
                          )}
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-xs font-medium text-blue-600">
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

                    {unreadCount > 0 && (
                      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                        {unreadCount}
                      </span>
                    )}

                    <span className="hidden text-sm font-semibold text-blue-600 sm:block">
                      →
                    </span>

                  </button>
                );
              })}

            </div>
          )}
        </section>

        {/* RECENT LISTINGS */}

        <section className="mb-9 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Listings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products you've recently uploaded.
              </p>
            </div>

            <button
              onClick={() => navigate("/my-listings")}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View All →
            </button>
          </div>

          {recentListings.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-5 py-10 text-center">
              <div className="text-3xl">📦</div>

              <h3 className="mt-3 font-semibold text-gray-800">
                No listings yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Your uploaded products will appear here.
              </p>

              <button
                onClick={() => navigate("/create-listing")}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {recentListings.map((listing) => (
                <button
                  key={listing._id}
                  onClick={() =>
                    navigate(`/listings/${listing._id}`)
                  }
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:-translate-y-1 hover:shadow-md"
                >

                  {listing.images?.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="h-44 w-full bg-gray-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gray-100 text-sm text-gray-400">
                      No Image Available
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="truncate font-bold text-gray-900">
                      {listing.title}
                    </h3>

                    <p className="mt-2 text-lg font-extrabold text-blue-600">
                      {formatPrice(listing)}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          listing.status === "active"
                            ? "bg-green-50 text-green-700"
                            : listing.status === "reserved"
                            ? "bg-amber-50 text-amber-700"
                            : listing.status === "completed"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {listing.status}
                      </span>

                      <span className="text-xs font-semibold text-blue-600">
                        Details →
                      </span>
                    </div>
                  </div>

                </button>
              ))}

            </div>
          )}
        </section>

        {/* FOOTER */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 py-6">
          <p className="text-xs text-gray-400">
            StudentMarket · Campus Marketplace
          </p>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

      </div>
    </main>
  );
};

export default Dashboard;
