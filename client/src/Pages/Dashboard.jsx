
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.name}!
        </h1>

        <div className="mt-6 space-y-3">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p>
            <strong>College:</strong>{" "}
            {user?.college?.name || "College information unavailable"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </main>
  );
}

export default Dashboard;
