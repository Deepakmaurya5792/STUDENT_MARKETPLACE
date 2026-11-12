
import api from "./api";

export const getColleges = async () => {
  const response = await api.get("/colleges");
  return response.data.data;
};
