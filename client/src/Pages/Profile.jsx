
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  removeProfileImage,
} from "../services/profileService";

const Profile = () => {
  const { updateAuthUser } = useAuth();

  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    branch: "",
    academicYear: "",
    bio: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  // ============================================
  // FETCH PROFILE
  // ============================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();

        setProfile(response.data);

        setFormData({
          name: response.data.name || "",
          branch: response.data.branch || "",
          academicYear: response.data.academicYear || "",
          bio: response.data.bio || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ============================================
  // HANDLE INPUT CHANGES
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================
  // UPDATE PROFILE
  // ============================================

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateMyProfile(formData);

      setProfile(response.data);

      setFormData({
        name: response.data.name || "",
        branch: response.data.branch || "",
        academicYear: response.data.academicYear || "",
        bio: response.data.bio || "",
      });

      // Update global authentication state
      updateAuthUser({
        name: response.data.name,
      });

      setEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // UPLOAD PROFILE IMAGE
  // ============================================

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG and WebP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size cannot exceed 5 MB.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const response = await uploadProfileImage(file);

      setProfile((prev) => ({
        ...prev,
        profileImage: response.data.profileImage,
        profileImagePublicId:
          response.data.profileImagePublicId,
      }));

      // Update global authentication state
      updateAuthUser({
        profileImage: response.data.profileImage,
      });

      setSuccess("Profile picture updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to upload profile picture"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ============================================
  // REMOVE PROFILE IMAGE
  // ============================================

  const handleRemoveImage = async () => {
    if (!profile?.profileImage) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture?"
    );

    if (!confirmed) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      await removeProfileImage();

      setProfile((prev) => ({
        ...prev,
        profileImage: "",
        profileImagePublicId: "",
      }));

      // Update global authentication state
      updateAuthUser({
        profileImage: "",
      });

      setSuccess("Profile picture removed successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to remove profile picture"
      );
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // CANCEL EDITING
  // ============================================

  const handleCancel = () => {
    setFormData({
      name: profile.name || "",
      branch: profile.branch || "",
      academicYear: profile.academicYear || "",
      bio: profile.bio || "",
    });

    setEditing(false);
    setError("");
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">
          {error || "Profile not found"}
        </p>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          My Profile
        </h1>

        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">

          {/* PROFILE IMAGE */}

          <div className="mb-8 flex flex-col items-center">

            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100">

              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-gray-400">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
              )}

            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Change Picture"}
              </button>

              {profile.profileImage && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleRemoveImage}
                  className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove Picture
                </button>
              )}

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            <p className="mt-2 text-xs text-gray-500">
              JPEG, PNG or WebP. Maximum 5 MB.
            </p>

          </div>

          {/* STATUS MESSAGES */}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          {/* PROFILE FORM */}

          <form onSubmit={handleSave}>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* NAME */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-4 py-3 text-gray-500"
                />
              </div>

              {/* COLLEGE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  College
                </label>

                <input
                  type="text"
                  value={profile.college?.name || ""}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-4 py-3 text-gray-500"
                />
              </div>

              {/* BRANCH */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Branch
                </label>

                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your branch"
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* ACADEMIC YEAR */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Academic Year
                </label>

                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select year</option>

                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* ROLE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Account Role
                </label>

                <input
                  type="text"
                  value={profile.role || ""}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-4 py-3 capitalize text-gray-500"
                />
              </div>

            </div>

            {/* BIO */}

            <div className="mt-5">

              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bio
              </label>

              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editing}
                maxLength={300}
                rows={4}
                placeholder="Tell something about yourself..."
                className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
              />

              <p className="mt-1 text-right text-xs text-gray-500">
                {formData.bio.length}/300
              </p>

            </div>

            {/* ACTION BUTTONS */}

            <div className="mt-7 flex justify-end gap-3">

              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-lg border px-5 py-2.5 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )}

            </div>

          </form>

        </div>
      </div>
    </div>
  );
};

export default Profile;
