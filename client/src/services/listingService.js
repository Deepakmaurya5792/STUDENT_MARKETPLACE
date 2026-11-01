import api from "./api";

// Create a new listing
export const createListing = async (listingData) => {
  const response = await api.post("/listings", listingData);
  return response.data;
};

// Get all listings
export const getAllListings = async (params = {}) => {
  const response = await api.get("/listings", { params });
  return response.data;
};

// Get single listing
export const getSingleListing = async (id) => {
  const response = await api.get(`/listings/${id}`);
  return response.data;
};

// Update listing
export const updateListing = async (id, listingData) => {
  const response = await api.patch(`/listings/${id}`, listingData);
  return response.data;
};

// Delete listing
export const deleteListing = async (id) => {
  const response = await api.delete(`/listings/${id}`);
  return response.data;
};

// Remove individual listing image
export const removeListingImage = async (id, publicId) => {
  const response = await api.delete(`/listings/${id}/images`, {
    data: { publicId },
  });
  return response.data;
};