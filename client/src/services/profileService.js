
import api from "./api";

// Get logged-in user's profile
export const getMyProfile = async () => {
  const response = await api.get("/profile/me");
  return response.data;
};

// Update profile information
export const updateMyProfile = async (profileData) => {
  const response = await api.patch("/profile/me", profileData);
  return response.data;
};

// Upload profile image
export const uploadProfileImage = async (image) => {
  const formData = new FormData();
  formData.append("image", image);

  const response = await api.patch(
    "/profile/me/image",
    formData
  );

  return response.data;
};

// Remove profile image
export const removeProfileImage = async () => {
  const response = await api.delete("/profile/me/image");
  return response.data;
};
