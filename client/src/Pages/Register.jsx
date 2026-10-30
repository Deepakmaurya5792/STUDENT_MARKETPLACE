
import { useState } from "react";
import api from "../services/api";
import CollegeSelect from "../components/CollegeSelect";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    collegeId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", formData);

      setSuccess(response.data.message || "Registration successful!");

      setFormData({
        name: "",
        email: "",
        password: "",
        collegeId: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow-lg"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join your student marketplace.
          </p>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="At least 8 characters"
          />
        </div>

        <CollegeSelect
          value={formData.collegeId}
          onChange={handleChange}
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}

export default Register;
