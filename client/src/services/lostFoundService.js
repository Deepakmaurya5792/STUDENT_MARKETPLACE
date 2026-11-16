import api from "./api";

export const getLostFoundItems = async (params = {}) => {
  const response = await api.get("/lost-found", { params });
  return response.data;
};

export const getLostFoundById = async (id) => {
  const response = await api.get(`/lost-found/${id}`);
  return response.data;
};

export const createLostFoundItem = async (formData) => {
  const response = await api.post("/lost-found", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateLostFoundStatus = async (id, status) => {
  const response = await api.patch(`/lost-found/${id}/status`, { status });
  return response.data;
};

export const claimLostFoundItem = async (id, payload) => {
  const response = await api.post(`/lost-found/${id}/claim`, payload);
  return response.data;
};

export const deleteLostFoundItem = async (id) => {
  const response = await api.delete(`/lost-found/${id}`);
  return response.data;
};

export const getFreecycleListings = async (params = {}) => {
  const response = await api.get("/lost-found/freecycle", { params });
  return response.data;
};
