
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import CollegeSelect from "../components/CollegeSelect";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    collegeId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Step 1: Register the user
      await api.post("/auth/register", formData);

      // Step 2: Automatically log in the new user
      await login({
        email: formData.email,
        password: formData.password,
      });

      // Step 3: Redirect to Marketplace
      navigate("/listings", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration or automatic login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">

        {/* Left Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-10 text-white md:flex">
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-bold text-blue-600">
              S
            </div>

            <h2 className="mt-10 text-4xl font-extrabold leading-tight">
              Join your
              <br />
              campus community.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Create an account and discover a better way to
              buy, sell, rent and exchange products with students.
            </p>
          </div>

          <div className="relative z-10 space-y-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold">
              What you can do
            </p>

            {[
              "Buy products from fellow students",
              "Sell things you no longer need",
              "Rent and exchange useful items",
              "Connect with your campus community",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  ✓
                </span>

                <span className="text-sm text-blue-50">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full border-[40px] border-white/10" />
          <div className="absolute -right-10 top-20 h-40 w-40 rounded-full bg-white/5" />
        </div>

        {/* Registration Form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-5"
          >
            <div>
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600 md:hidden">
                S
              </div>

              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Get Started
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Join the student marketplace in just a few steps.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Use at least 8 characters.
              </p>
            </div>

            {/* College */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Your College
              </label>

              <CollegeSelect
                value={formData.collegeId}
                onChange={handleChange}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Log In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default Register;
