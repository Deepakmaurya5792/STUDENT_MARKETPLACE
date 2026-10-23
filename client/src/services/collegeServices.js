
import axios from "axios";

const API_URL = "http://localhost:5000/api/colleges";

export const getColleges = async () => {
  const response = await axios.get(API_URL, {
    withCredentials: true,
  });

  return response.data.data;
};
