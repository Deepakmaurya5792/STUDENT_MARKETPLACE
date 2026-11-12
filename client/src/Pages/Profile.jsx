
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

  // FETCH PROFILE
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

  // HANDLE INPUT CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // UPDATE PROFILE
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

  // UPLOAD PROFILE IMAGE
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

  // REMOVE PROFILE IMAGE
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

  // CANCEL EDITING
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

  // INPUT STYLES
  const inputStyle = (editable = true) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${
      editing && editable
        ? "border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        : "border-gray-100 bg-gray-50 text-gray-600"
    }`;

  // LOADING
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Loading profile...
        </p>
      </div>
    );
  }

  // PROFILE NOT FOUND
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-red-600">
          {error || "Profile not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* PAGE HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your personal information and account details.
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* PROFILE HEADER */}
          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-5 py-6 sm:px-8">

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">

              {/* PROFILE IMAGE WITH HOVER + ICON */}
              <div className="relative h-24 w-24 shrink-0">

                <div className="group relative h-full w-full overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-sm">

                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-blue-600">
                      {profile.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}

                  {/* CHANGE PHOTO BUTTON */}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change profile photo"
                    title="Change profile photo"
                    className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-all duration-200 hover:bg-black/45 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-2xl font-medium text-blue-600 shadow-md opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      +
                    </span>
                  </button>
                </div>

                {/* HIDDEN FILE INPUT */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* USER INFORMATION */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h2 className="truncate text-xl font-bold text-gray-900">
                  {profile.name}
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {profile.email}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {profile.college?.name || "College not available"}
                </p>

                <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                  {profile.role || "Student"}
                </span>
              </div>

              {/* REMOVE PHOTO */}
              {profile.profileImage && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleRemoveImage}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {uploading ? "Please wait..." : "Remove Photo"}
                </button>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-gray-400 sm:text-left">
              Click the photo to change it · JPEG, PNG or WebP · Maximum 5 MB
            </p>
          </div>

          {/* FORM CONTENT */}
          <div className="p-5 sm:p-8">

            {/* SECTION HEADER */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Personal Information
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Your personal and academic details.
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  Edit Profile
                </button>
              )}
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
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                    className={inputStyle()}
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={profile.email || ""}
                    disabled
                    className={inputStyle(false)}
                  />
                </div>

                {/* COLLEGE */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    College
                  </label>

                  <input
                    type="text"
                    value={profile.college?.name || ""}
                    disabled
                    className={inputStyle(false)}
                  />
                </div>

                {/* BRANCH */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Branch
                  </label>

                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter your branch"
                    className={inputStyle()}
                  />
                </div>

                {/* ACADEMIC YEAR */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Academic Year
                  </label>

                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    disabled={!editing}
                    className={inputStyle()}
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
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Account Role
                  </label>

                  <input
                    type="text"
                    value={profile.role || ""}
                    disabled
                    className={`${inputStyle(false)} capitalize`}
                  />
                </div>
              </div>

              {/* BIO */}
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Bio
                  </label>

                  <span className="text-xs text-gray-400">
                    {formData.bio.length}/300
                  </span>
                </div>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={300}
                  rows={3}
                  placeholder="Tell something about yourself..."
                  className={`${inputStyle()} resize-none`}
                />
              </div>

              {/* FORM ACTIONS */}
              {editing && (
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
